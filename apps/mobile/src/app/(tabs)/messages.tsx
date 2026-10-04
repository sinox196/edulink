import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  canMessage,
  childrenOf,
  formatStamp,
  getClass,
  getStudent,
  parentsOf,
  studentsInClass,
  subjectName,
  teacherDisplayName,
  teacherForUser,
  type ConversationCategory,
} from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Avatar, Button, Card, Chip, EmptyState, Icon, ListRow, PressableScale, Row, SectionHeader } from '../../components/ui';
import { Sheet } from '../../components/Sheet';
import { FadeIn } from '../../components/animated';
import { NewsFeed } from '../../features/NewsFeed';
import { conversationTitle } from '../../lib/conversations';

type Cat = 'all' | ConversationCategory;

export default function MessagesTab() {
  const { user } = useStore();
  const { t } = useI18n();
  if (user?.role === 'student') {
    return (
      <Screen title={t('news.title')} back={false} inTabs>
        <NewsFeed />
      </Screen>
    );
  }
  return <Inbox />;
}

function Inbox() {
  const { db, user, startConversation } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const [cat, setCat] = useState<Cat>('all');
  const [composer, setComposer] = useState(false);

  const convs = useMemo(() => {
    if (!user) return [];
    return db.conversations
      .filter((cv) => cv.participantIds.includes(user.id))
      .map((cv) => {
        const msgs = db.messages.filter((m) => m.conversationId === cv.id).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
        const last = msgs[msgs.length - 1];
        const unread = msgs.filter((m) => m.senderId !== user.id && !m.readAt).length;
        return { cv, last, unread, view: conversationTitle(db, cv, user.id) };
      })
      .sort((a, b) => (b.last?.sentAt ?? '').localeCompare(a.last?.sentAt ?? ''));
  }, [db, user]);

  if (!user) return null;
  const shown = convs.filter((x) => cat === 'all' || x.cv.category === cat);
  const cats: Cat[] = ['all', 'teacher', 'administration', 'transport', 'accounting'];

  /* Contacts allowed by the school's messaging policy. */
  const contacts = (() => {
    if (user.role === 'parent') {
      const kids = childrenOf(db, user.id);
      const teacherIds = new Set(db.timetable.filter((s) => kids.some((k) => k.classId === s.classId) && s.teacherId).map((s) => s.teacherId!));
      const teachers = db.teachers.filter((tt) => teacherIds.has(tt.id)).map((tt) => db.users.find((u) => u.id === tt.userId)!).filter((u) => canMessage(db, user, u));
      const staff = db.users.filter((u) => ['u-staff-vs', 'u-staff-transport', 'u-staff-compta'].includes(u.id) && canMessage(db, user, u));
      return [...teachers.map((u) => ({ user: u, subtitle: subjectName(teacherForUser(db, u.id)?.subjectIds[0], locale), studentId: kids.find((k) => teacherForUser(db, u.id)?.classIds.includes(k.classId))?.id })), ...staff.map((u) => ({ user: u, subtitle: t('messages.cat.administration'), studentId: undefined }))];
    }
    if (user.role === 'teacher') {
      const teacher = teacherForUser(db, user.id);
      const cls = teacher?.classIds[0];
      return cls
        ? studentsInClass(db, cls)
            .slice(0, 12)
            .flatMap((s) => parentsOf(db, s.id).slice(0, 1).map((p) => ({ user: p, subtitle: `${t('teacher.parentsOf', { name: s.firstName })} · ${getClass(db, cls)?.name}`, studentId: s.id })))
        : [];
    }
    return db.users.filter((u) => u.role === 'teacher').slice(0, 10).map((u) => ({ user: u, subtitle: subjectName(teacherForUser(db, u.id)?.subjectIds[0], locale), studentId: undefined }));
  })();

  return (
    <Screen title={t('messages.title')} back={false} inTabs right={<Button label={t('messages.new')} icon="create-outline" size="sm" full={false} onPress={() => setComposer(true)} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: space.lg }}>
        {cats.map((k) => (
          <Chip key={k} label={t(`messages.cat.${k}`)} selected={cat === k} onPress={() => setCat(k)} count={k === 'all' ? undefined : convs.filter((x) => x.cv.category === k).length} />
        ))}
      </ScrollView>

      {shown.length ? (
        <Card padded={false}>
          {shown.map(({ cv, last, unread, view }, i) => (
            <FadeIn key={cv.id} index={i}>
              <PressableScale onPress={() => router.push(`/chat/${cv.id}`)} accessibilityRole="button" accessibilityLabel={`${view.title}, ${unread ? `${unread} non lus, ` : ''}${last?.body ?? ''}`} scale={0.99}>
                <Row style={{ padding: space.lg, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
                  <Avatar name={view.title} color={view.color} size={48} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                        {view.title}
                      </Txt>
                      <Txt variant="caption" tone={unread ? 'primary' : 'tertiary'}>
                        {last ? formatStamp(last.sentAt, locale) : ''}
                      </Txt>
                    </Row>
                    <Txt variant="caption" tone="secondary" numberOfLines={1}>
                      {view.subtitle}
                      {cv.studentId && user.role === 'parent' ? ` · ${getStudent(db, cv.studentId)?.firstName}` : ''}
                    </Txt>
                    <Row gap={6}>
                      {last?.senderId === user.id ? <Icon name={last.readAt ? 'checkmark-done' : 'checkmark'} size={15} color={last.readAt ? c.primary : c.textTertiary} /> : null}
                      {last?.attachment ? <Icon name="attach" size={15} color={c.textSecondary} /> : null}
                      <Txt variant="caption" tone={unread ? 'default' : 'secondary'} weight={unread ? 'bold' : 'medium'} numberOfLines={1} style={{ flex: 1 }}>
                        {last?.body}
                      </Txt>
                      {unread ? (
                        <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                          <Txt variant="label" color="#FFFFFF" style={{ fontSize: 11 }}>
                            {unread}
                          </Txt>
                        </View>
                      ) : null}
                    </Row>
                  </View>
                </Row>
              </PressableScale>
            </FadeIn>
          ))}
        </Card>
      ) : (
        <EmptyState icon="chatbubbles-outline" title={t('messages.empty')} />
      )}

      <Row gap={8} style={{ marginTop: space.lg, backgroundColor: c.backgroundAlt, padding: space.md, borderRadius: radius.md }}>
        <Icon name="lock-closed" size={16} color={c.successText} />
        <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
          {t('messages.secure')}
        </Txt>
      </Row>

      <Sheet visible={composer} onClose={() => setComposer(false)} title={t('messages.chooseContact')}>
        <SectionHeader title={t('messages.new')} style={{ marginTop: 0 }} />
        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          {contacts.map(({ user: u, subtitle, studentId }) => {
            const tch = teacherForUser(db, u.id);
            const name = tch ? teacherDisplayName(tch) : `${u.title ?? ''} ${u.firstName} ${u.lastName}`.trim();
            return (
              <ListRow
                key={u.id + (studentId ?? '')}
                icon={u.role === 'teacher' ? 'school-outline' : u.role === 'parent' ? 'people-outline' : 'business-outline'}
                title={name}
                subtitle={subtitle}
                onPress={() => {
                  const id = startConversation(u.id, studentId);
                  setComposer(false);
                  router.push(`/chat/${id}`);
                }}
              />
            );
          })}
        </Card>
      </Sheet>
    </Screen>
  );
}
