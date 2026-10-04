import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { absencesByClass, normalize, studentsInClass, teacherForUser, getClass } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, Chip, IconBadge, ListRow, PressableScale, Row, SectionHeader, TextField, type IconName } from '../../components/ui';
import { FadeIn } from '../../components/animated';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { useStudentData } from '../../lib/hooks';
import type { TranslationKey } from '../../i18n/fr';

type Tile = { key: TranslationKey; icon: IconName; route: string; color: 'primary' | 'academic' | 'success' | 'event' | 'warning' | 'secondary'; badge?: string };

export default function SchoolTab() {
  const { user } = useStore();
  if (user?.role === 'teacher') return <TeacherClasses />;
  if (user?.role === 'admin') return <AdminEstablishment />;
  return <FamilyHub />;
}

function FamilyHub() {
  const { db, user } = useStore();
  const { c, textScale } = useTheme();
  const { t } = useI18n();
  const data = useStudentData();
  const m = db.school.modules;
  const isParent = user?.role === 'parent';
  const pendingJustif = data?.attendance.filter((a) => a.status === 'absent' && !a.justification).length ?? 0;
  const todo = data?.homework.filter((h) => h.status === 'todo').length ?? 0;

  const groups: { title: TranslationKey; tiles: Tile[] }[] = [
    {
      title: 'school.academics',
      tiles: [
        { key: 'school.grades', icon: 'stats-chart', route: '/grades', color: 'academic', badge: data?.average ? `${data.average.average}` : undefined },
        { key: 'school.attendance', icon: 'checkmark-done-circle', route: '/attendance', color: 'success', badge: data ? `${data.stats.rate}%` : undefined },
        { key: 'school.homework', icon: 'create', route: '/homework', color: 'primary', badge: todo ? String(todo) : undefined },
        { key: 'school.timetable', icon: 'grid', route: '/timetable', color: 'secondary' },
        { key: 'school.reportCards', icon: 'ribbon', route: '/report-cards', color: 'academic' },
        { key: 'school.exams', icon: 'document-text', route: '/exams', color: 'warning' },
        { key: 'school.analytics', icon: 'trending-up', route: '/analytics', color: 'academic' },
        { key: 'school.behavior', icon: 'star', route: '/behavior', color: 'success' },
      ],
    },
    {
      title: 'school.life',
      tiles: [
        { key: 'school.events', icon: 'calendar', route: '/events', color: 'event' },
        { key: 'school.news', icon: 'newspaper', route: '/news', color: 'primary' },
        { key: 'school.announcements', icon: 'megaphone', route: '/announcements', color: 'warning' },
        ...(isParent && m.appointments ? [{ key: 'school.appointments', icon: 'people', route: '/appointments', color: 'secondary' } as Tile] : []),
        { key: 'school.documents', icon: 'folder-open', route: '/documents', color: 'primary' },
      ],
    },
    {
      title: 'school.services',
      tiles: [
        ...(isParent && m.payments ? [{ key: 'school.payments', icon: 'card', route: '/payments', color: 'success' } as Tile] : []),
        ...(m.transport ? [{ key: 'school.transport', icon: 'bus', route: '/transport', color: 'warning' } as Tile] : []),
        ...(m.canteen ? [{ key: 'school.canteen', icon: 'restaurant', route: '/canteen', color: 'event' } as Tile] : []),
        ...(m.clubs ? [{ key: 'school.clubs', icon: 'football', route: '/clubs', color: 'academic' } as Tile] : []),
      ],
    },
  ];

  const colorOf = (k: Tile['color']) =>
    ({ primary: [c.primary, c.primarySoft], academic: [c.academic, c.academicSoft], success: [c.successText, c.successSoft], event: [c.event, c.eventSoft], warning: [c.warningText, c.warningSoft], secondary: [c.secondary, c.secondarySoft] })[k];

  return (
    <Screen title={t('school.title')} subtitle={data ? `${data.student.firstName} · ${data.cls.name}` : undefined} back={false} inTabs>
      {isParent ? <ChildSwitcher /> : null}
      {pendingJustif && isParent ? (
        <Card tone="warning" onPress={() => router.push('/attendance/justify')} style={{ marginTop: space.lg }}>
          <Row>
            <IconBadge icon="document-attach" color={c.warningText} bg={c.card} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{t('attendance.justify')}</Txt>
              <Txt variant="caption" tone="secondary">
                {t('attendance.pending')}
              </Txt>
            </View>
          </Row>
        </Card>
      ) : null}
      {groups.map((g, gi) =>
        g.tiles.length ? (
          <FadeIn key={g.title} index={gi}>
            <SectionHeader title={t(g.title)} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
              {g.tiles.map((tile) => {
                const [fg, bg] = colorOf(tile.color);
                return (
                  <PressableScale key={tile.key} onPress={() => router.push(tile.route as never)} accessibilityRole="button" accessibilityLabel={tile.badge ? `${t(tile.key)}, ${tile.badge}` : t(tile.key)} style={{ flexBasis: textScale > 1 ? '46%' : '30%', flexGrow: 1, minWidth: 100, backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: space.md, gap: space.sm, minHeight: 104 }}>
                    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <IconBadge icon={tile.icon} color={fg} bg={bg} size={40} />
                      {tile.badge ? (
                        <Txt variant="captionStrong" color={fg}>
                          {tile.badge}
                        </Txt>
                      ) : null}
                    </Row>
                    <Txt variant="captionStrong" numberOfLines={2}>
                      {t(tile.key)}
                    </Txt>
                  </PressableScale>
                );
              })}
            </View>
          </FadeIn>
        ) : null,
      )}
    </Screen>
  );
}

function TeacherClasses() {
  const { db, user } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const teacher = user ? teacherForUser(db, user.id) : undefined;
  if (!teacher) return null;
  return (
    <Screen title={t('teacher.myClasses')} back={false} inTabs>
      {teacher.classIds.map((id, i) => {
        const cls = getClass(db, id)!;
        const students = studentsInClass(db, id);
        return (
          <FadeIn key={id} index={i} style={{ marginBottom: space.md }}>
            <Card onPress={() => router.push(`/teacher/class/${id}`)}>
              <Row>
                <IconBadge icon="people" color={c.primary} bg={c.primarySoft} size={48} />
                <View style={{ flex: 1 }}>
                  <Txt variant="heading">{cls.name}</Txt>
                  <Txt variant="caption" tone="secondary">
                    {t('teacher.students', { n: students.length })} · {t('teacher.classAverage', { avg: cls.average })}
                  </Txt>
                </View>
              </Row>
            </Card>
          </FadeIn>
        );
      })}
    </Screen>
  );
}

function AdminEstablishment() {
  const { db } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState<'all' | 'primaire' | 'college' | 'lycee'>('all');
  const abs = useMemo(() => new Map(absencesByClass(db).map((a) => [a.classId, a])), [db]);
  const students = useMemo(() => (q.length >= 2 ? db.students.filter((s) => normalize(`${s.firstName} ${s.lastName} ${s.studentNumber}`).includes(normalize(q))).slice(0, 20) : []), [db, q]);
  const classes = db.classes.filter((cl) => level === 'all' || cl.level === level);

  return (
    <Screen title={t('tab.establishment')} subtitle={db.school.name} back={false} inTabs>
      <TextField label={t('admin.students')} icon="search" value={q} onChangeText={setQ} placeholder="Nom, prénom, matricule…" />
      {students.length ? (
        <Card padded={false} style={{ paddingHorizontal: space.lg, marginTop: space.md }}>
          {students.map((s) => (
            <ListRow key={s.id} icon="person" title={`${s.firstName} ${s.lastName}`} subtitle={`${getClass(db, s.classId)?.name} · ${s.studentNumber}`} chevron={false} />
          ))}
        </Card>
      ) : null}
      <SectionHeader title={`${t('admin.classes')} (${classes.length})`} />
      <Row gap={8} wrap style={{ marginBottom: space.md }}>
        {(['all', 'primaire', 'college', 'lycee'] as const).map((l) => (
          <Chip key={l} label={l === 'all' ? t('common.all') : l === 'primaire' ? 'Primaire' : l === 'college' ? 'Collège' : 'Lycée'} selected={level === l} onPress={() => setLevel(l)} />
        ))}
      </Row>
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        {classes.map((cl) => {
          const a = abs.get(cl.id);
          return (
            <ListRow
              key={cl.id}
              icon="grid-outline"
              iconColor={c.secondary}
              iconBg={c.secondarySoft}
              title={cl.name}
              subtitle={`${t('teacher.students', { n: cl.studentCount })} · ${t('teacher.classAverage', { avg: cl.average })}`}
              chevron={false}
              right={<Txt variant="captionStrong" tone={a && a.absences > 2 ? 'error' : 'secondary'}>{a?.absences ?? 0} abs.</Txt>}
            />
          );
        })}
      </Card>
    </Screen>
  );
}
