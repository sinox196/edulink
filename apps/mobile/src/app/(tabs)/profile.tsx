import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { childrenOf, getClass, studentForUser, teacherDisplayName, teacherForUser, subjectName } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n, LANGUAGES } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Avatar, Button, Card, Divider, ListRow, Pill, Row, SectionHeader } from '../../components/ui';
import { Sheet } from '../../components/Sheet';
import { SchoolCrest } from '../../components/brand';
import { FadeIn } from '../../components/animated';

export default function ProfileTab() {
  const { db, user, logout, prefs, selectChild } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const [confirm, setConfirm] = useState(false);
  if (!user) return null;
  const teacher = teacherForUser(db, user.id);
  const kids = user.role === 'parent' ? childrenOf(db, user.id) : [];
  const me = user.role === 'student' ? studentForUser(db, user.id) : undefined;
  const displayName = teacher ? teacherDisplayName(teacher) : `${user.firstName} ${user.lastName}`;

  return (
    <Screen title={t('profile.title')} back={false} inTabs>
      <FadeIn>
        <Card>
          <Row gap={14}>
            <Avatar name={`${user.firstName} ${user.lastName}`} color={user.avatarColor} size={64} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="title">{displayName}</Txt>
              <Pill label={t(`profile.role.${user.role}`)} tone="info" small />
              {teacher ? (
                <Txt variant="caption" tone="secondary">
                  {subjectName(teacher.subjectIds[0], locale)}
                </Txt>
              ) : null}
            </View>
          </Row>
          <Divider />
          <View style={{ gap: 2, marginTop: space.sm }}>
            <ListRow icon="mail-outline" title={user.email} subtitle={t('auth.method.email')} chevron={false} />
            {user.phone ? <ListRow icon="call-outline" title={user.phone} subtitle={t('auth.method.phone')} chevron={false} /> : null}
            {user.schoolCode ? <ListRow icon="id-card-outline" title={user.schoolCode} subtitle={t('auth.method.schoolId')} chevron={false} /> : null}
          </View>
        </Card>
      </FadeIn>

      {kids.length ? (
        <FadeIn index={1}>
          <SectionHeader title={t('profile.children')} />
          <Card padded={false} style={{ paddingHorizontal: space.lg }}>
            {kids.map((k) => (
              <ListRow
                key={k.id}
                emoji={k.gender === 'F' ? '👧' : '👦'}
                iconBg={c.academicSoft}
                title={`${k.firstName} ${k.lastName}`}
                subtitle={`${getClass(db, k.classId)?.name} · ${k.studentNumber}`}
                onPress={() => {
                  selectChild(k.id);
                  router.push('/(tabs)');
                }}
              />
            ))}
          </Card>
        </FadeIn>
      ) : null}
      {me ? (
        <FadeIn index={1}>
          <SectionHeader title={t('analytics.student')} />
          <Card>
            <ListRow emoji="🎒" title={`${me.firstName} ${me.lastName}`} subtitle={`${getClass(db, me.classId)?.name} · ${me.studentNumber}`} chevron={false} />
          </Card>
        </FadeIn>
      ) : null}

      <FadeIn index={2}>
        <SectionHeader title={t('profile.school')} />
        <Card>
          <Row gap={12}>
            <SchoolCrest size={48} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{db.school.name}</Txt>
              <Txt variant="caption" tone="secondary">
                {db.school.address}
              </Txt>
              <Txt variant="caption" tone="secondary">
                {db.school.phone} · {db.school.website}
              </Txt>
            </View>
          </Row>
        </Card>
      </FadeIn>

      <FadeIn index={3}>
        <SectionHeader title={t('profile.settings')} />
        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          <ListRow icon="notifications-outline" title={t('profile.notifications')} onPress={() => router.push('/settings/notifications')} />
          <ListRow icon="language-outline" iconColor={c.secondary} iconBg={c.secondarySoft} title={t('profile.language')} subtitle={LANGUAGES.find((l) => l.code === prefs.locale)?.native} onPress={() => router.push('/settings/appearance')} />
          <ListRow icon="contrast-outline" iconColor={c.academic} iconBg={c.academicSoft} title={t('profile.appearance')} subtitle={t(`settings.theme.${prefs.themeMode}`)} onPress={() => router.push('/settings/appearance')} />
          <ListRow icon="eye-off-outline" iconColor={c.successText} iconBg={c.successSoft} title={t('profile.privacy')} onPress={() => router.push('/settings/privacy')} />
          <ListRow icon="shield-checkmark-outline" iconColor={c.warningText} iconBg={c.warningSoft} title={t('profile.security')} subtitle={prefs.biometricEnabled ? t('settings.security.biometric') : undefined} onPress={() => router.push('/settings/security')} />
        </Card>
      </FadeIn>

      <FadeIn index={4}>
        <SectionHeader title={t('profile.help')} />
        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          <ListRow icon="help-buoy-outline" title={t('profile.help')} onPress={() => router.push('/help')} />
          <ListRow icon="call-outline" iconColor={c.secondary} iconBg={c.secondarySoft} title={t('profile.contact')} onPress={() => router.push('/help')} />
        </Card>
      </FadeIn>

      <Button label={t('profile.logout')} variant="danger" icon="log-out-outline" style={{ marginTop: space.xxl }} onPress={() => setConfirm(true)} />
      <Txt variant="caption" tone="tertiary" align="center" style={{ marginTop: space.lg }}>
        {t('profile.version', { v: '1.0.0' })}
      </Txt>

      <Sheet visible={confirm} onClose={() => setConfirm(false)} title={t('profile.logout')}>
        <Txt variant="body" tone="secondary">
          {t('profile.logoutConfirm')}
        </Txt>
        <Button
          label={t('profile.logout')}
          variant="danger"
          icon="log-out-outline"
          onPress={async () => {
            setConfirm(false);
            await logout();
            router.replace('/login');
          }}
        />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirm(false)} />
      </Sheet>
    </Screen>
  );
}
