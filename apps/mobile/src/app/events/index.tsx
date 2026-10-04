import React, { useState } from 'react';
import { View } from 'react-native';
import { DEMO_TODAY, eventsForClass } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../../store/AppStore';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Segmented } from '../../components/ui';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { FadeIn } from '../../components/animated';
import { EventCard } from '../../features/home/widgets';

export default function Events() {
  const { db, user } = useStore();
  const { t } = useI18n();
  const student = useCurrentStudent();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const all = student ? eventsForClass(db, student.classId) : db.events;
  const items = tab === 'upcoming' ? all.filter((e) => e.date >= DEMO_TODAY) : all.filter((e) => e.date < DEMO_TODAY).reverse();
  return (
    <Screen title={t('events.title')}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      <View style={{ marginVertical: space.lg }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: t('events.upcoming'), count: all.filter((e) => e.date >= DEMO_TODAY).length },
            { value: 'past', label: t('events.past') },
          ]}
        />
      </View>
      <View style={{ gap: space.md }}>
        {items.map((e, i) => (
          <FadeIn key={e.id} index={i}>
            <EventCard event={e} studentId={student?.id} />
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}
