import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { DEMO_TODAY, formatDate, startOfWeek, addDays } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, Card, Chip, Icon, Pill, Row, SectionHeader, TextField } from '../components/ui';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { FadeIn } from '../components/animated';

const ALLERGENS = ['Arachides', 'Fruits à coque', 'Gluten', 'Lait', 'Œuf', 'Poisson'];
const PREFS = ['Végétarien', 'Sans porc', 'Sans viande'];

export default function Canteen() {
  const { db, user, updateDietary, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  const profile = student ? db.dietaryProfiles.find((p) => p.studentId === student.id) : undefined;
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies ?? []);
  const [preferences, setPreferences] = useState<string[]>(profile?.preferences ?? []);
  const [notes, setNotes] = useState(profile?.notes ?? '');

  useEffect(() => {
    setAllergies(profile?.allergies ?? []);
    setPreferences(profile?.preferences ?? []);
    setNotes(profile?.notes ?? '');
  }, [student?.id, profile]);

  if (!student) return null;
  const today = db.canteenMenus.find((m) => m.date === DEMO_TODAY);
  const weekStart = startOfWeek(DEMO_TODAY);
  const week = db.canteenMenus.filter((m) => m.date >= weekStart && m.date <= addDays(weekStart, 4));
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const alertFor = (allergens: string[]) => allergens.find((a) => allergies.includes(a));

  return (
    <Screen title={t('canteen.title')}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      {today ? (
        <FadeIn style={{ marginTop: space.lg }}>
          <SectionHeader title={`🍽️ ${t('canteen.today')}`} style={{ marginTop: 0 }} />
          <Card>
            {[
              [t('canteen.starter'), today.starter, '🥗'],
              [t('canteen.main'), `${today.main}${today.side ? ` + ${today.side}` : ''}`, '🍗'],
              [t('canteen.dessert'), today.dessert, '🍎'],
            ].map(([label, value, emoji], i) => (
              <Row key={label} style={{ paddingVertical: space.md, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
                <Txt style={{ fontSize: 26, width: 40 }} align="center">
                  {emoji}
                </Txt>
                <View style={{ flex: 1 }}>
                  <Txt variant="caption" tone="secondary">
                    {label}
                  </Txt>
                  <Txt variant="bodyStrong">{value}</Txt>
                </View>
              </Row>
            ))}
            <Pill label={`🌱 ${t('canteen.vegetarian')} : ${today.vegetarian}`} tone="success" />
          </Card>
        </FadeIn>
      ) : null}

      <SectionHeader title={t('canteen.week')} />
      <View style={{ gap: space.sm }}>
        {week.map((m) => {
          const alert = alertFor(m.allergens);
          return (
            <Card key={m.date} style={m.date === DEMO_TODAY ? { borderColor: c.primary, borderWidth: 1.5 } : undefined}>
              <Row style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 52, alignItems: 'center', backgroundColor: c.eventSoft, borderRadius: radius.sm, paddingVertical: 6 }}>
                  <Txt variant="label" tone="event">
                    {formatDate(m.date, locale, 'weekday').slice(0, 3)}
                  </Txt>
                  <Txt variant="heading" tone="event">
                    {Number(m.date.slice(8))}
                  </Txt>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong">{m.main}</Txt>
                  <Txt variant="caption" tone="secondary">
                    {m.starter} · {m.dessert}
                  </Txt>
                  {m.allergens.length ? (
                    <Txt variant="caption" tone="tertiary">
                      {t('canteen.allergens')} : {m.allergens.join(', ')}
                    </Txt>
                  ) : null}
                  {alert ? <Pill label={t('canteen.alert', { allergen: alert })} tone="error" icon="warning" small /> : null}
                </View>
              </Row>
            </Card>
          );
        })}
      </View>

      {user?.role === 'parent' ? (
        <>
          <SectionHeader title={t('canteen.diet')} />
          <Card style={{ gap: space.lg }}>
            <View style={{ gap: space.sm }}>
              <Txt variant="captionStrong" tone="secondary">
                {t('canteen.allergies')}
              </Txt>
              <Row gap={8} wrap>
                {ALLERGENS.map((a) => (
                  <Chip key={a} label={a} selected={allergies.includes(a)} onPress={() => toggle(allergies, setAllergies, a)} icon={allergies.includes(a) ? 'warning' : undefined} color={c.error} />
                ))}
              </Row>
            </View>
            <View style={{ gap: space.sm }}>
              <Txt variant="captionStrong" tone="secondary">
                {t('canteen.preferences')}
              </Txt>
              <Row gap={8} wrap>
                {PREFS.map((p) => (
                  <Chip key={p} label={p} selected={preferences.includes(p)} onPress={() => toggle(preferences, setPreferences, p)} />
                ))}
              </Row>
            </View>
            <TextField label={t('canteen.notes')} value={notes} onChangeText={setNotes} multiline />
            <Button label={t('common.save')} icon="checkmark" onPress={() => { updateDietary({ studentId: student.id, allergies, preferences, notes }); showToast({ title: t('canteen.title'), body: t('canteen.saved'), category: 'success' }); }} />
            <Row gap={8}>
              <Icon name="lock-closed" size={14} color={c.textTertiary} />
              <Txt variant="caption" tone="tertiary" style={{ flex: 1 }}>
                {t('canteen.policy')}
              </Txt>
            </Row>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
