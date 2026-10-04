-- EduLink — schéma PostgreSQL
-- Toutes les tables sont préfixées par l'établissement (school_id) : la plateforme est multi-écoles.
-- Les identifiants sont des textes (UUID générés par défaut) afin d'accepter aussi les
-- identifiants lisibles des données de démonstration.

-- gen_random_uuid() fait partie du cœur de PostgreSQL depuis la version 13 (aucune extension requise).

create schema if not exists app;

/* ------------------------------------------------------------------ Types */

create type app.locale as enum ('fr', 'ar', 'en');
create type app.user_role as enum ('parent', 'student', 'teacher', 'admin');
create type app.school_level as enum ('primaire', 'college', 'lycee');
create type app.attendance_status as enum ('present', 'late', 'absent', 'excused', 'unexcused', 'early_leave');
create type app.checkin_source as enum ('qr', 'rfid', 'nfc', 'badge', 'teacher', 'admin');
create type app.justification_status as enum ('pending', 'accepted', 'rejected');
create type app.priority as enum ('normal', 'important', 'critical');
create type app.rsvp as enum ('yes', 'no', 'maybe');
create type app.conversation_category as enum ('teacher', 'administration', 'transport', 'accounting');
create type app.document_category as enum ('report_card', 'certificate', 'rules', 'authorization', 'timetable', 'invoice', 'pedagogical');
create type app.payment_category as enum ('tuition', 'transport', 'canteen', 'activities', 'books', 'trips');
create type app.payment_status as enum ('paid', 'pending', 'overdue');
create type app.notification_category as enum ('urgent', 'grades', 'attendance', 'events', 'homework', 'messages', 'payments', 'transport');
create type app.feedback_kind as enum ('positive', 'improvement');
create type app.appointment_status as enum ('confirmed', 'pending', 'completed', 'cancelled');

create or replace function app.new_id() returns text language sql as $$ select gen_random_uuid()::text $$;

/* ------------------------------------------------------------ Établissement */

create table schools (
  id               text primary key default app.new_id(),
  name             text not null,
  short_name       text not null,
  city             text,
  address          text,
  phone            text,
  email            text,
  website          text,
  principal        text,
  primary_language app.locale not null default 'fr',
  levels           app.school_level[] not null default '{}',
  academic_year    text not null,
  currency         text not null default 'DT',
  -- Modules optionnels activables par l'école (paiements, transport, cantine, clubs, QR, messages vocaux…)
  modules          jsonb not null default '{}'::jsonb,
  -- Politique de messagerie contrôlée par l'administration
  messaging_policy jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

/* -------------------------------------------------------------- Comptes */

create table users (
  id               text primary key default app.new_id(),
  school_id        text not null references schools(id) on delete cascade,
  role             app.user_role not null,
  first_name       text not null,
  last_name        text not null,
  title            text check (title in ('M.', 'Mme')),
  email            text not null,
  phone            text,
  school_code      text,                      -- identifiant fourni par l'école (connexion)
  password_hash    text,                      -- scrypt$N$r$p$sel$hash, jamais en clair
  avatar_color     text,
  activated        boolean not null default false,
  activation_code  text,
  preferred_locale app.locale,
  last_active_at   timestamptz,
  failed_logins    int not null default 0,
  locked_until     timestamptz,
  created_at       timestamptz not null default now(),
  unique (school_id, email),
  unique (school_id, school_code)
);
create index users_school_role_idx on users (school_id, role);

create table parents (
  user_id    text primary key references users(id) on delete cascade,
  address    text,
  profession text
);

create table administrators (
  user_id   text primary key references users(id) on delete cascade,
  job_title text
);

create table teachers (
  id               text primary key default app.new_id(),
  user_id          text not null unique references users(id) on delete cascade,
  school_id        text not null references schools(id) on delete cascade,
  accepts_messages boolean not null default true
);

create table subjects (
  id          text primary key default app.new_id(),
  school_id   text not null references schools(id) on delete cascade,
  name        text not null,
  short_name  text not null,
  color       text not null,
  icon        text,
  coefficient numeric(4,1) not null default 1
);

create table classes (
  id                   text primary key default app.new_id(),
  school_id            text not null references schools(id) on delete cascade,
  name                 text not null,
  level                app.school_level not null,
  grade                text not null,
  section              text not null,
  homeroom_teacher_id  text references teachers(id) on delete set null,
  room                 text,
  academic_year        text not null,
  unique (school_id, academic_year, name)
);

create table students (
  id             text primary key default app.new_id(),
  school_id      text not null references schools(id) on delete cascade,
  user_id        text unique references users(id) on delete set null,  -- compte élève (optionnel)
  class_id       text references classes(id) on delete set null,
  first_name     text not null,
  last_name      text not null,
  gender         char(1) check (gender in ('F', 'M')),
  birth_date     date,
  student_number text not null,
  avatar_color   text,
  enrolled_at    date,
  unique (school_id, student_number)
);
create index students_class_idx on students (class_id);

-- Association parent / élève : un parent n'accède qu'à SES enfants.
create table student_parents (
  student_id         text not null references students(id) on delete cascade,
  parent_id          text not null references users(id) on delete cascade,
  relation           text not null,
  is_primary_contact boolean not null default false,
  primary key (student_id, parent_id)
);
create index student_parents_parent_idx on student_parents (parent_id);

-- Un enseignant n'accède qu'à ses classes autorisées.
create table teacher_classes (
  teacher_id text not null references teachers(id) on delete cascade,
  class_id   text not null references classes(id) on delete cascade,
  subject_id text references subjects(id) on delete set null,
  primary key (teacher_id, class_id)
);
create index teacher_classes_class_idx on teacher_classes (class_id);

/* ------------------------------------------------------------- Scolarité */

create table timetables (
  id         text primary key default app.new_id(),
  class_id   text not null references classes(id) on delete cascade,
  day        smallint not null check (day between 1 and 7),
  starts_at  time not null,
  ends_at    time not null,
  subject_id text references subjects(id) on delete set null,   -- null = pause / déjeuner
  label      text,
  room       text,
  teacher_id text references teachers(id) on delete set null,
  check (ends_at > starts_at)
);
create index timetables_class_day_idx on timetables (class_id, day);
create index timetables_teacher_idx on timetables (teacher_id, day);

-- Un appel (séance) effectué par un enseignant
create table attendance_sessions (
  id           text primary key default app.new_id(),
  class_id     text not null references classes(id) on delete cascade,
  teacher_id   text not null references teachers(id),
  date         date not null,
  starts_at    time not null,
  submitted_at timestamptz not null default now(),
  unique (class_id, date, starts_at)
);

create table attendance (
  id            text primary key default app.new_id(),
  student_id    text not null references students(id) on delete cascade,
  date          date not null,
  status        app.attendance_status not null,
  check_in      time,
  check_out     time,
  minutes_late  int check (minutes_late >= 0),
  source        app.checkin_source not null default 'teacher',
  note          text,
  -- Justification envoyée par le parent
  justification_reason     text,
  justification_message    text,
  justification_document   text,           -- clé du fichier dans le stockage sécurisé
  justification_submitted_at timestamptz,
  justification_submitted_by text references users(id),
  justification_status     app.justification_status,
  updated_at    timestamptz not null default now(),
  unique (student_id, date)
);
create index attendance_date_idx on attendance (date);

create table grades (
  id            text primary key default app.new_id(),
  student_id    text not null references students(id) on delete cascade,
  subject_id    text not null references subjects(id),
  teacher_id    text not null references teachers(id),
  exam_name     text not null,
  date          date not null,
  score         numeric(5,2) not null check (score >= 0),
  out_of        numeric(5,2) not null default 20 check (out_of > 0),
  coefficient   numeric(4,1) not null default 1,
  class_average numeric(5,2),
  comment       text,
  term          smallint not null,
  created_at    timestamptz not null default now(),
  check (score <= out_of)
);
create index grades_student_idx on grades (student_id, term);

create table exams (
  id               text primary key default app.new_id(),
  class_id         text not null references classes(id) on delete cascade,
  subject_id       text not null references subjects(id),
  teacher_id       text not null references teachers(id),
  title            text not null,
  date             date not null,
  starts_at        time,
  duration_minutes int,
  room             text,
  chapters         text[] not null default '{}',
  revision_docs    jsonb not null default '[]'::jsonb
);
create index exams_class_date_idx on exams (class_id, date);

create table homework (
  id                text primary key default app.new_id(),
  class_id          text not null references classes(id) on delete cascade,
  subject_id        text not null references subjects(id),
  teacher_id        text not null references teachers(id),
  title             text not null,
  description       text,
  assigned_at       date not null,
  due_date          date not null,
  estimated_minutes int,
  attachments       jsonb not null default '[]'::jsonb
);
create index homework_class_due_idx on homework (class_id, due_date);

create table homework_completions (
  homework_id  text not null references homework(id) on delete cascade,
  student_id   text not null references students(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (homework_id, student_id)
);

create table report_cards (
  id                  text primary key default app.new_id(),
  student_id          text not null references students(id) on delete cascade,
  academic_year       text not null,
  class_label         text not null,
  period              text not null,
  term                smallint not null,
  average             numeric(5,2),
  class_average       numeric(5,2),
  rank                int,
  class_size          int,
  subjects            jsonb not null default '[]'::jsonb,
  teacher_observation text,
  principal_comment   text,
  mention             text,
  pdf_path            text,
  published_at        date,
  status              text not null default 'in_progress' check (status in ('published', 'in_progress')),
  unique (student_id, academic_year, term)
);

create table teacher_feedback (
  id         text primary key default app.new_id(),
  student_id text not null references students(id) on delete cascade,
  teacher_id text not null references teachers(id),
  subject_id text references subjects(id),
  kind       app.feedback_kind not null,
  text       text not null,
  date       date not null default current_date
);
create index teacher_feedback_student_idx on teacher_feedback (student_id, date desc);

/* ------------------------------------------------------- Vie de l'école */

create table announcements (
  id               text primary key default app.new_id(),
  school_id        text not null references schools(id) on delete cascade,
  title            text not null,
  body             text not null,
  published_at     timestamptz not null default now(),
  author_id        text not null references users(id),
  author_name      text not null,
  scope            text not null check (scope in ('school', 'class')),
  class_ids        text[] not null default '{}',
  category         text not null,
  priority         app.priority not null default 'normal',
  requires_ack     boolean not null default false,
  recipient_count  int not null default 0
);

-- Accusés de lecture des communications critiques (« J'ai lu l'information »)
create table announcement_acks (
  announcement_id text not null references announcements(id) on delete cascade,
  user_id         text not null references users(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create table news (
  id           text primary key default app.new_id(),
  school_id    text not null references schools(id) on delete cascade,
  title        text not null,
  excerpt      text not null,
  body         text not null,
  published_at date not null,
  category     text not null,
  cover        jsonb,
  read_minutes int
);

create table events (
  id                     text primary key default app.new_id(),
  school_id              text not null references schools(id) on delete cascade,
  title                  text not null,
  emoji                  text,
  description            text,
  date                   date not null,
  starts_at              time,
  ends_at                time,
  location               text,
  category               text not null,
  class_ids              text[] not null default '{}',   -- vide = toute l'école
  requires_authorization boolean not null default false,
  cost                   numeric(8,2),
  organizer              text
);
create index events_school_date_idx on events (school_id, date);

create table event_participants (
  event_id                text not null references events(id) on delete cascade,
  student_id              text not null references students(id) on delete cascade,
  response                app.rsvp,
  authorization_signed_at timestamptz,
  signed_by               text references users(id),
  signature_svg           text,
  primary key (event_id, student_id)
);

/* ------------------------------------------------------------ Messagerie */

create table conversations (
  id           text primary key default app.new_id(),
  school_id    text not null references schools(id) on delete cascade,
  category     app.conversation_category not null,
  student_id   text references students(id) on delete set null,
  title        text not null,
  subtitle     text,
  avatar_color text,
  created_at   timestamptz not null default now()
);

create table conversation_participants (
  conversation_id text not null references conversations(id) on delete cascade,
  user_id         text not null references users(id) on delete cascade,
  primary key (conversation_id, user_id)
);
create index conversation_participants_user_idx on conversation_participants (user_id);

create table messages (
  id              text primary key default app.new_id(),
  conversation_id text not null references conversations(id) on delete cascade,
  sender_id       text not null references users(id),
  body            text not null,
  sent_at         timestamptz not null default now(),
  read_at         timestamptz,
  attachment      jsonb
);
create index messages_conversation_idx on messages (conversation_id, sent_at);

/* ------------------------------------------------------------ Documents */

create table documents (
  id                 text primary key default app.new_id(),
  school_id          text not null references schools(id) on delete cascade,
  title              text not null,
  category           app.document_category not null,
  date               date not null,
  size               text,
  file_type          text not null,
  storage_path       text,                     -- stockage objet chiffré, URL signée à la demande
  student_id         text references students(id) on delete cascade, -- document nominatif
  class_ids          text[],                   -- document de classe
  requires_signature boolean not null default false,
  shared_by          text
);

create table document_signatures (
  document_id text not null references documents(id) on delete cascade,
  user_id     text not null references users(id) on delete cascade,
  signed_at   timestamptz not null default now(),
  signature   text,
  primary key (document_id, user_id)
);

/* -------------------------------------------------------------- Paiements */

create table payments (
  id             text primary key default app.new_id(),
  student_id     text not null references students(id) on delete cascade,
  category       app.payment_category not null,
  label          text not null,
  amount         numeric(10,2) not null check (amount >= 0),
  due_date       date not null,
  status         app.payment_status not null default 'pending',
  paid_at        date,
  receipt_number text,
  method         text,
  provider_ref   text                          -- référence du prestataire de paiement (futur)
);
create index payments_student_idx on payments (student_id, due_date);
create index payments_status_idx on payments (status, due_date);

/* -------------------------------------------------------------- Transport */

create table buses (
  id                text primary key default app.new_id(),
  school_id         text not null references schools(id) on delete cascade,
  number            int not null,
  driver_first_name text not null,
  plate             text,
  capacity          int,
  unique (school_id, number)
);

create table transport_routes (
  id        text primary key default app.new_id(),
  bus_id    text not null references buses(id) on delete cascade,
  name      text not null,
  direction text not null check (direction in ('to_school', 'to_home')),
  stops     jsonb not null default '[]'::jsonb
);

create table bus_assignments (
  student_id       text primary key references students(id) on delete cascade,
  bus_id           text not null references buses(id) on delete cascade,
  morning_route_id text references transport_routes(id),
  evening_route_id text references transport_routes(id),
  stop_name        text not null
);

create table transport_live (
  bus_id          text primary key references buses(id) on delete cascade,
  route_id        text references transport_routes(id),
  state           text not null,
  next_stop_index int not null default 0,
  delay_minutes   int not null default 0,
  updated_at      timestamptz not null default now()
);

/* ---------------------------------------------------------- Notifications */

create table notifications (
  id         text primary key default app.new_id(),
  user_id    text not null references users(id) on delete cascade,
  student_id text references students(id) on delete cascade,
  category   app.notification_category not null,
  title      text not null,
  body       text not null,
  link       text,
  created_at timestamptz not null default now(),
  read       boolean not null default false
);
create index notifications_user_idx on notifications (user_id, created_at desc);

create table notification_preferences (
  user_id  text not null references users(id) on delete cascade,
  category app.notification_category not null,
  push     boolean not null default true,
  email    boolean not null default false,
  primary key (user_id, category)
);

create table push_tokens (
  id         text primary key default app.new_id(),
  user_id    text not null references users(id) on delete cascade,
  token      text not null unique,             -- FCM / APNs
  platform   text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now()
);

/* ------------------------------------------------------------ Rendez-vous */

create table appointment_slots (
  id         text primary key default app.new_id(),
  teacher_id text not null references teachers(id) on delete cascade,
  date       date not null,
  starts_at  time not null,
  ends_at    time not null,
  booked_by  text references users(id)
);

create table appointments (
  id         text primary key default app.new_id(),
  slot_id    text references appointment_slots(id) on delete set null,
  parent_id  text not null references users(id) on delete cascade,
  teacher_id text not null references teachers(id),
  student_id text not null references students(id) on delete cascade,
  date       date not null,
  starts_at  time not null,
  ends_at    time not null,
  reason     text,
  mode       text not null default 'in_person' check (mode in ('in_person', 'video')),
  status     app.appointment_status not null default 'confirmed'
);

/* ----------------------------------------------------- Clubs & cantine */

create table clubs (
  id          text primary key default app.new_id(),
  school_id   text not null references schools(id) on delete cascade,
  name        text not null,
  emoji       text,
  description text,
  schedule    text,
  supervisor  text,
  capacity    int not null,
  levels      app.school_level[] not null default '{}',
  fee         numeric(8,2)
);

create table club_registrations (
  club_id       text not null references clubs(id) on delete cascade,
  student_id    text not null references students(id) on delete cascade,
  status        text not null check (status in ('registered', 'waitlist')),
  registered_at date not null default current_date,
  primary key (club_id, student_id)
);

create table canteen_menus (
  school_id  text not null references schools(id) on delete cascade,
  date       date not null,
  starter    text,
  main       text,
  side       text,
  dessert    text,
  vegetarian text,
  allergens  text[] not null default '{}',
  primary key (school_id, date)
);

create table dietary_profiles (
  student_id  text primary key references students(id) on delete cascade,
  allergies   text[] not null default '{}',
  preferences text[] not null default '{}',
  notes       text,
  updated_at  timestamptz not null default now()
);

create table holidays (
  id        text primary key default app.new_id(),
  school_id text not null references schools(id) on delete cascade,
  label     text not null,
  starts_on date not null,
  ends_on   date not null
);

/* -------------------------------------------------- Sécurité & audit */

create table user_sessions (
  id           text primary key default app.new_id(),
  user_id      text not null references users(id) on delete cascade,
  refresh_hash text not null,               -- hash du refresh token (rotation)
  device       text,
  ip           inet,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz
);
create index user_sessions_user_idx on user_sessions (user_id);

create table audit_logs (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  actor_id   text,
  actor_name text,
  action     text not null,
  target     text,
  details    jsonb
);
create index audit_logs_at_idx on audit_logs (at desc);
