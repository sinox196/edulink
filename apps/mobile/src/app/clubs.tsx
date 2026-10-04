import React from 'react';
import { View } from 'react-native';
import { getClass } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, Card, Pill, ProgressBar, Row } from '../components/ui';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { FadeIn } from '../components/animated';

export default function Clubs() {
  const { db, user, registerClub, showToast } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const student = useCurrentStudent();
  if (!student) return null;
  const level = getClass(db, student.classId)?.level;
  const clubs = db.clubs.filter((cl) => !level || cl.levels.includes(level));

  return (
    <Screen title={t('clubs.title')} subtitle={student.firstName}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      <View style={{ gap: space.md, marginTop: space.lg }}>
        {clubs.map((cl, i) => {
          const reg = db.clubRegistrations.find((r) => r.clubId === cl.id && r.studentId === student.id);
          const left = cl.capacity - cl.enrolled;
          const full = left <= 0;
          return (
            <FadeIn key={cl.id} index={i}>
              <Card>
                <Row style={{ alignItems: 'flex-start' }}>
                  <View style={{ width: 54, height: 54, borderRadius: radius.md, backgroundColor: c.academicSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt style={{ fontSize: 28, lineHeight: 34 }}>{cl.emoji}</Txt>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt variant="heading">{cl.name}</Txt>
                    <Txt variant="caption" tone="secondary">
                      {cl.description}
                    </Txt>
                    <Txt variant="caption">🕒 {cl.schedule}</Txt>
                    <Txt variant="caption">👤 {t('clubs.supervisor', { name: cl.supervisor })}</Txt>
                    {cl.fee ? <Txt variant="caption">💳 {cl.fee} {db.school.currency}</Txt> : null}
                  </View>
                </Row>
                <View style={{ marginTop: space.md, gap: 6 }}>
                  <ProgressBar value={cl.enrolled / cl.capacity} color={full ? c.error : c.secondary} />
                  <Txt variant="caption" tone={full ? 'error' : 'secondary'}>
                    {full ? t('clubs.full') : t('clubs.places', { n: left })} · {cl.enrolled}/{cl.capacity}
                  </Txt>
                </View>
                <View style={{ marginTop: space.md }}>
                  {reg ? (
                    <Pill label={reg.status === 'registered' ? t('clubs.registered') : t('clubs.waitlist')} tone={reg.status === 'registered' ? 'success' : 'warning'} icon={reg.status === 'registered' ? 'checkmark-circle' : 'hourglass'} />
                  ) : user?.role === 'parent' ? (
                    <Button
                      label={full ? t('clubs.joinWaitlist') : t('clubs.register')}
                      variant={full ? 'secondary' : 'primary'}
                      icon={full ? 'hourglass-outline' : 'add-circle-outline'}
                      size="sm"
                      onPress={() => {
                        const status = registerClub(cl.id, student.id);
                        showToast({ title: t('clubs.title'), body: status === 'registered' ? t('clubs.success', { name: student.firstName, club: cl.name }) : t('clubs.waitlist'), category: 'success' });
                      }}
                    />
                  ) : null}
                </View>
              </Card>
            </FadeIn>
          );
        })}
      </View>
    </Screen>
  );
}
