import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { addDays, DEMO_TODAY, formatDate, isSchoolDay } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Chip, Row, TextField, ToggleRow } from '../../components/ui';
import { ClassPicker, useMyClasses } from '../../features/teacher/ClassPicker';

const EMOJIS = ['🎭', '🏃', '🔬', '🏛️', '🎨', '📚', '🎵', '🌳'];

export default function CreateEvent() {
  const { createEvent, showToast } = useStore();
  const { t, locale } = useI18n();
  const classes = useMyClasses();
  const [classIds, setClassIds] = useState<string[]>(classes.slice(0, 1));
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🔬');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [auth, setAuth] = useState(false);
  const days = Array.from({ length: 30 }, (_, i) => addDays(DEMO_TODAY, i + 3)).filter(isSchoolDay).slice(0, 8);
  const [date, setDate] = useState(days[0]);

  return (
    <Screen
      title={t('teacher.createEvent')}
      footer={
        <Button
          label={t('common.publish')}
          icon="calendar"
          disabled={!title.trim() || !location.trim() || !classIds.length}
          onPress={() => {
            createEvent({ title: title.trim(), emoji, date, time: '14:00', location: location.trim(), classIds, requiresAuthorization: auth, description: description.trim() });
            showToast({ title: t('events.title'), body: t('teacher.eventSaved'), category: 'success' });
            router.back();
          }}
        />
      }
    >
      <View style={{ gap: space.lg }}>
        <ClassPicker multiple values={classIds} onChangeMany={setClassIds} />
        <Row gap={8} wrap>
          {EMOJIS.map((e) => (
            <Chip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />
          ))}
        </Row>
        <TextField label={t('common.title')} value={title} onChangeText={setTitle} />
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('common.date')}
          </Txt>
          <Row gap={8} wrap>
            {days.map((d) => (
              <Chip key={d} label={formatDate(d, locale, 'weekday')} selected={date === d} onPress={() => setDate(d)} />
            ))}
          </Row>
        </View>
        <TextField label={t('teacher.location')} value={location} onChangeText={setLocation} />
        <TextField label={t('common.description')} value={description} onChangeText={setDescription} multiline />
        <ToggleRow icon="create-outline" label={t('teacher.requiresAuth')} value={auth} onChange={setAuth} />
      </View>
    </Screen>
  );
}
