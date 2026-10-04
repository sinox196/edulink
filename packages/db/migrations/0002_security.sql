-- EduLink — contrôle d'accès (RBAC + Row Level Security) et journal d'audit.
--
-- L'API se connecte avec le propriétaire du schéma puis, pour chaque requête authentifiée :
--   begin;
--   set local role edulink_app;
--   select set_config('app.user_id', '<id issu du JWT vérifié>', true);
--   ... requêtes ...
--   commit;
-- Toutes les règles ci-dessous s'appliquent alors au niveau de la base : même un bug dans
-- l'API ne peut pas exposer les données d'un autre enfant. Le propriétaire (migrations,
-- tâches système) et les fonctions « security definer » ne sont pas soumis à RLS.

do $$ begin
  create role edulink_app nologin;
exception when duplicate_object then null; end $$;

grant usage on schema public, app to edulink_app;
grant select, insert, update, delete on all tables in schema public to edulink_app;
grant usage on all sequences in schema public to edulink_app;
-- Le journal d'audit est en ajout seul.
revoke update, delete on audit_logs from edulink_app;

/* ------------------------------------------------------------ Contexte */

create or replace function app.uid() returns text
language sql stable as $$ select nullif(current_setting('app.user_id', true), '') $$;

create or replace function app.user_role() returns app.user_role
language sql stable security definer set search_path = public, app as $$
  select role from users where id = app.uid()
$$;

create or replace function app.user_school() returns text
language sql stable security definer set search_path = public, app as $$
  select school_id from users where id = app.uid()
$$;

create or replace function app.is_admin() returns boolean
language sql stable as $$ select coalesce(app.user_role() = 'admin', false) $$;

create or replace function app.my_teacher_id() returns text
language sql stable security definer set search_path = public, app as $$
  select id from teachers where user_id = app.uid()
$$;

/** Élèves visibles : ses enfants (parent), soi-même (élève), ses classes (enseignant), l'école (admin). */
create or replace function app.visible_student_ids() returns setof text
language sql stable security definer set search_path = public, app as $$
  select sp.student_id from student_parents sp where sp.parent_id = app.uid()
  union
  select s.id from students s where s.user_id = app.uid()
  union
  select s.id from students s join teacher_classes tc on tc.class_id = s.class_id
   where tc.teacher_id = app.my_teacher_id()
  union
  select s.id from students s where app.is_admin() and s.school_id = app.user_school()
$$;

create or replace function app.can_see_student(p_student text) returns boolean
language sql stable as $$ select p_student in (select app.visible_student_ids()) $$;

/** Classes visibles (pour l'emploi du temps, les devoirs, les annonces de classe…). */
create or replace function app.visible_class_ids() returns setof text
language sql stable security definer set search_path = public, app as $$
  select s.class_id from students s where s.id in (select app.visible_student_ids()) and s.class_id is not null
  union
  select tc.class_id from teacher_classes tc where tc.teacher_id = app.my_teacher_id()
  union
  select c.id from classes c where app.is_admin() and c.school_id = app.user_school()
$$;

create or replace function app.teaches_class(p_class text) returns boolean
language sql stable security definer set search_path = public, app as $$
  select app.is_admin() or exists (
    select 1 from teacher_classes where teacher_id = app.my_teacher_id() and class_id = p_class
  )
$$;

create or replace function app.class_of(p_student text) returns text
language sql stable security definer set search_path = public, app as $$
  select class_id from students where id = p_student
$$;

create or replace function app.is_parent_of(p_student text) returns boolean
language sql stable security definer set search_path = public, app as $$
  select exists (select 1 from student_parents where parent_id = app.uid() and student_id = p_student)
$$;

create or replace function app.in_conversation(p_conversation text) returns boolean
language sql stable security definer set search_path = public, app as $$
  select exists (select 1 from conversation_participants where conversation_id = p_conversation and user_id = app.uid())
$$;

/* ---------------------------------------------------- Activation de RLS */

do $$
declare t text;
begin
  foreach t in array array[
    'schools','users','parents','administrators','teachers','subjects','classes','students','student_parents',
    'teacher_classes','timetables','attendance_sessions','attendance','grades','exams','homework','homework_completions',
    'report_cards','teacher_feedback','announcements','announcement_acks','news','events','event_participants',
    'conversations','conversation_participants','messages','documents','document_signatures','payments','buses',
    'transport_routes','bus_assignments','transport_live','notifications','notification_preferences','push_tokens',
    'appointment_slots','appointments','clubs','club_registrations','canteen_menus','dietary_profiles','holidays',
    'user_sessions','audit_logs'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

/* ------------------------------------------------- Référentiel école */

create policy school_read on schools for select to edulink_app using (id = app.user_school());
create policy school_admin on schools for update to edulink_app using (app.is_admin() and id = app.user_school());

create policy subjects_read on subjects for select to edulink_app using (school_id = app.user_school());
create policy subjects_admin on subjects for all to edulink_app using (app.is_admin() and school_id = app.user_school());

create policy classes_read on classes for select to edulink_app using (id in (select app.visible_class_ids()));
create policy classes_admin on classes for all to edulink_app using (app.is_admin() and school_id = app.user_school());

create policy holidays_read on holidays for select to edulink_app using (school_id = app.user_school());
create policy holidays_admin on holidays for all to edulink_app using (app.is_admin() and school_id = app.user_school());

create policy news_read on news for select to edulink_app using (school_id = app.user_school());
create policy news_admin on news for all to edulink_app using (app.is_admin() and school_id = app.user_school());

create policy canteen_read on canteen_menus for select to edulink_app using (school_id = app.user_school());
create policy canteen_admin on canteen_menus for all to edulink_app using (app.is_admin() and school_id = app.user_school());

create policy clubs_read on clubs for select to edulink_app using (school_id = app.user_school());
create policy clubs_admin on clubs for all to edulink_app using (app.is_admin() and school_id = app.user_school());

/* ------------------------------------------------------------ Personnes */

-- Chacun voit son profil ; le personnel et les enseignants sont visibles dans l'école ;
-- un parent n'est visible que des enseignants de ses enfants et de l'administration.
create policy users_self on users for select to edulink_app using (id = app.uid());
create policy users_staff on users for select to edulink_app
  using (school_id = app.user_school() and role in ('teacher', 'admin'));
create policy users_parents_for_teachers on users for select to edulink_app using (
  role = 'parent' and exists (
    select 1 from student_parents sp
    where sp.parent_id = users.id and app.teaches_class(app.class_of(sp.student_id))
  )
);
create policy users_admin on users for all to edulink_app using (app.is_admin() and school_id = app.user_school());
create policy users_update_self on users for update to edulink_app using (id = app.uid()) with check (id = app.uid());

create policy parents_self on parents for select to edulink_app using (user_id = app.uid() or app.is_admin());
create policy administrators_read on administrators for select to edulink_app using (app.user_school() is not null);

create policy teachers_read on teachers for select to edulink_app using (school_id = app.user_school());
create policy teachers_admin on teachers for all to edulink_app using (app.is_admin());

create policy students_read on students for select to edulink_app using (app.can_see_student(id));
create policy students_admin on students for all to edulink_app using (app.is_admin() and school_id = app.user_school());

create policy student_parents_read on student_parents for select to edulink_app
  using (parent_id = app.uid() or app.can_see_student(student_id) and app.user_role() in ('teacher', 'admin'));
create policy student_parents_admin on student_parents for all to edulink_app using (app.is_admin());

create policy teacher_classes_read on teacher_classes for select to edulink_app using (class_id in (select app.visible_class_ids()));
create policy teacher_classes_admin on teacher_classes for all to edulink_app using (app.is_admin());

/* ------------------------------------------------------------- Scolarité */

create policy timetables_read on timetables for select to edulink_app
  using (class_id in (select app.visible_class_ids()) or teacher_id = app.my_teacher_id());
create policy timetables_admin on timetables for all to edulink_app using (app.is_admin());

create policy attendance_read on attendance for select to edulink_app using (app.can_see_student(student_id));
create policy attendance_write on attendance for all to edulink_app
  using (app.teaches_class(app.class_of(student_id)))
  with check (app.teaches_class(app.class_of(student_id)));

create policy attendance_sessions_rw on attendance_sessions for all to edulink_app
  using (app.teaches_class(class_id)) with check (app.teaches_class(class_id));

create policy grades_read on grades for select to edulink_app using (app.can_see_student(student_id));
create policy grades_write on grades for all to edulink_app
  using (app.is_admin() or teacher_id = app.my_teacher_id() and app.teaches_class(app.class_of(student_id)))
  with check (app.is_admin() or teacher_id = app.my_teacher_id() and app.teaches_class(app.class_of(student_id)));

create policy exams_read on exams for select to edulink_app using (class_id in (select app.visible_class_ids()));
create policy exams_write on exams for all to edulink_app using (app.teaches_class(class_id)) with check (app.teaches_class(class_id));

create policy homework_read on homework for select to edulink_app using (class_id in (select app.visible_class_ids()));
create policy homework_write on homework for all to edulink_app using (app.teaches_class(class_id)) with check (app.teaches_class(class_id));

create policy completions_read on homework_completions for select to edulink_app using (app.can_see_student(student_id));
-- Seul l'élève coche ses propres devoirs.
create policy completions_student on homework_completions for all to edulink_app
  using (exists (select 1 from students s where s.id = student_id and s.user_id = app.uid()))
  with check (exists (select 1 from students s where s.id = student_id and s.user_id = app.uid()));

create policy report_cards_read on report_cards for select to edulink_app
  using (app.can_see_student(student_id) and (status = 'published' or app.user_role() in ('teacher', 'admin')));
create policy report_cards_admin on report_cards for all to edulink_app using (app.is_admin());

create policy feedback_read on teacher_feedback for select to edulink_app using (app.can_see_student(student_id));
create policy feedback_write on teacher_feedback for all to edulink_app
  using (teacher_id = app.my_teacher_id() and app.teaches_class(app.class_of(student_id)))
  with check (teacher_id = app.my_teacher_id() and app.teaches_class(app.class_of(student_id)));

/* --------------------------------------------------------- Vie scolaire */

create policy announcements_read on announcements for select to edulink_app using (
  school_id = app.user_school() and (scope = 'school' or class_ids && array(select app.visible_class_ids()))
);
create policy announcements_admin on announcements for all to edulink_app using (app.is_admin() and school_id = app.user_school());
-- Un enseignant publie uniquement pour ses classes, jamais à toute l'école.
create policy announcements_teacher on announcements for insert to edulink_app with check (
  app.user_role() = 'teacher' and scope = 'class' and priority <> 'critical'
  and class_ids <@ array(select class_id from teacher_classes where teacher_id = app.my_teacher_id())
);

create policy acks_self on announcement_acks for all to edulink_app using (user_id = app.uid()) with check (user_id = app.uid());
create policy acks_admin on announcement_acks for select to edulink_app using (app.is_admin());

create policy events_read on events for select to edulink_app using (
  school_id = app.user_school() and (cardinality(class_ids) = 0 or class_ids && array(select app.visible_class_ids()))
);
create policy events_admin on events for all to edulink_app using (app.is_admin() and school_id = app.user_school());
create policy events_teacher on events for insert to edulink_app with check (
  app.user_role() = 'teacher' and cardinality(class_ids) > 0
  and class_ids <@ array(select class_id from teacher_classes where teacher_id = app.my_teacher_id())
);

create policy participants_read on event_participants for select to edulink_app using (app.can_see_student(student_id));
create policy participants_parent on event_participants for all to edulink_app
  using (app.is_parent_of(student_id)) with check (app.is_parent_of(student_id));

/* ----------------------------------------------------------- Messagerie */

create policy conversations_member on conversations for select to edulink_app using (app.in_conversation(id) or app.is_admin());
create policy conversations_create on conversations for insert to edulink_app with check (school_id = app.user_school());
create policy conv_participants_member on conversation_participants for select to edulink_app using (app.in_conversation(conversation_id));
create policy conv_participants_add on conversation_participants for insert to edulink_app with check (app.in_conversation(conversation_id) or user_id = app.uid());

create policy messages_member on messages for select to edulink_app using (app.in_conversation(conversation_id));
create policy messages_send on messages for insert to edulink_app
  with check (sender_id = app.uid() and app.in_conversation(conversation_id));
create policy messages_read_receipt on messages for update to edulink_app
  using (app.in_conversation(conversation_id) and sender_id <> app.uid());

/* -------------------------------------------------------------- Documents */

create policy documents_read on documents for select to edulink_app using (
  school_id = app.user_school() and (
    (student_id is not null and app.can_see_student(student_id))
    or (student_id is null and class_ids is not null and class_ids && array(select app.visible_class_ids()))
    or (student_id is null and class_ids is null)
  )
);
create policy documents_admin on documents for all to edulink_app using (app.is_admin());
create policy documents_teacher on documents for insert to edulink_app with check (
  app.user_role() = 'teacher' and category = 'pedagogical'
  and class_ids <@ array(select class_id from teacher_classes where teacher_id = app.my_teacher_id())
);
create policy signatures_self on document_signatures for all to edulink_app using (user_id = app.uid()) with check (user_id = app.uid());
create policy signatures_admin on document_signatures for select to edulink_app using (app.is_admin());

/* -------------------------------------------------------------- Paiements */

-- Les enseignants n'ont aucun accès aux paiements.
create policy payments_family on payments for select to edulink_app using (app.is_parent_of(student_id));
create policy payments_admin on payments for all to edulink_app using (app.is_admin());

/* -------------------------------------------------------------- Transport */

create policy buses_read on buses for select to edulink_app using (school_id = app.user_school());
create policy buses_admin on buses for all to edulink_app using (app.is_admin());
create policy routes_read on transport_routes for select to edulink_app using (true);
create policy routes_admin on transport_routes for all to edulink_app using (app.is_admin());
-- Une famille ne voit que l'affectation (et donc l'arrêt) de ses propres enfants.
create policy assignments_family on bus_assignments for select to edulink_app using (app.can_see_student(student_id));
create policy assignments_admin on bus_assignments for all to edulink_app using (app.is_admin());
create policy live_read on transport_live for select to edulink_app using (
  app.is_admin() or bus_id in (select bus_id from bus_assignments where app.can_see_student(student_id))
);
create policy live_admin on transport_live for all to edulink_app using (app.is_admin());

/* ---------------------------------------------------------- Notifications */

create policy notifications_self on notifications for all to edulink_app using (user_id = app.uid()) with check (user_id = app.uid() or app.user_role() in ('teacher', 'admin'));
create policy notification_prefs_self on notification_preferences for all to edulink_app using (user_id = app.uid()) with check (user_id = app.uid());
create policy push_tokens_self on push_tokens for all to edulink_app using (user_id = app.uid()) with check (user_id = app.uid());

/* --------------------------------------------------- Rendez-vous, clubs */

create policy slots_read on appointment_slots for select to edulink_app using (true);
create policy slots_teacher on appointment_slots for all to edulink_app using (teacher_id = app.my_teacher_id() or app.is_admin());
create policy appointments_read on appointments for select to edulink_app
  using (parent_id = app.uid() or teacher_id = app.my_teacher_id() or app.is_admin());
create policy appointments_parent on appointments for insert to edulink_app
  with check (parent_id = app.uid() and app.is_parent_of(student_id));
create policy appointments_update on appointments for update to edulink_app
  using (parent_id = app.uid() or teacher_id = app.my_teacher_id());

create policy club_reg_read on club_registrations for select to edulink_app using (app.can_see_student(student_id));
create policy club_reg_parent on club_registrations for all to edulink_app
  using (app.is_parent_of(student_id) or app.is_admin()) with check (app.is_parent_of(student_id) or app.is_admin());

create policy dietary_read on dietary_profiles for select to edulink_app using (app.can_see_student(student_id));
create policy dietary_parent on dietary_profiles for all to edulink_app
  using (app.is_parent_of(student_id)) with check (app.is_parent_of(student_id));

/* ------------------------------------------------------- Sessions & audit */

create policy sessions_self on user_sessions for all to edulink_app using (user_id = app.uid()) with check (user_id = app.uid());
create policy audit_admin on audit_logs for select to edulink_app using (app.is_admin());
create policy audit_insert on audit_logs for insert to edulink_app with check (true);

/* ------------------------------------------- Fonctions métier sécurisées */

/** Justification d'absence par un parent : seuls les champs de justification sont modifiables. */
create or replace function app.justify_absence(p_attendance text, p_reason text, p_message text, p_document text)
returns void language plpgsql security definer set search_path = public, app as $$
declare v_student text;
begin
  select student_id into v_student from attendance where id = p_attendance;
  if v_student is null or not app.is_parent_of(v_student) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update attendance set
    justification_reason = p_reason,
    justification_message = p_message,
    justification_document = p_document,
    justification_submitted_at = now(),
    justification_submitted_by = app.uid(),
    justification_status = 'pending',
    updated_at = now()
  where id = p_attendance and status in ('absent', 'unexcused', 'late');
end $$;
grant execute on function app.justify_absence(text, text, text, text) to edulink_app;

/** Taux d'accusés de lecture d'une communication critique (tableau de bord admin). */
create or replace function app.ack_rate(p_announcement text) returns numeric
language sql stable security definer set search_path = public, app as $$
  select round(100.0 * count(k.user_id) / nullif(max(a.recipient_count), 0), 1)
  from announcements a left join announcement_acks k on k.announcement_id = a.id
  where a.id = p_announcement and app.is_admin()
$$;
grant execute on function app.ack_rate(text) to edulink_app;

/* ---------------------------------------------------------------- Audit */

create or replace function app.audit_trigger() returns trigger
language plpgsql security definer set search_path = public, app as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
begin
  insert into audit_logs (actor_id, actor_name, action, target, details)
  values (
    app.uid(),
    (select concat_ws(' ', title, first_name, last_name) from users where id = app.uid()),
    lower(tg_op) || ' ' || tg_table_name,
    v_row ->> 'id',
    case when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)) else v_row end
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['grades', 'attendance', 'announcements', 'payments', 'documents', 'student_parents', 'report_cards', 'teacher_classes'] loop
    execute format('create trigger %I after insert or update or delete on %I for each row execute function app.audit_trigger()', t || '_audit', t);
  end loop;
end $$;
