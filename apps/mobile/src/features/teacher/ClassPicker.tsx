import React from 'react';
import { ScrollView, View } from 'react-native';
import { getClass, teacherForUser } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Txt } from '../../components/Txt';
import { Chip } from '../../components/ui';

/** Classes the signed-in teacher is authorised for (admin: a curated set of classes). */
export function useMyClasses(): string[] {
  const { db, user } = useStore();
  if (!user) return [];
  if (user.role === 'admin') return db.classes.filter((c) => c.level === 'college').map((c) => c.id);
  return teacherForUser(db, user.id)?.classIds ?? [];
}

export function ClassPicker({ value, onChange, multiple, values, onChangeMany }: { value?: string; onChange?: (id: string) => void; multiple?: boolean; values?: string[]; onChangeMany?: (ids: string[]) => void }) {
  const { db } = useStore();
  const { t } = useI18n();
  const classes = useMyClasses();
  return (
    <View style={{ gap: space.sm }}>
      <Txt variant="captionStrong" tone="secondary">
        {t('common.class')}
      </Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {classes.map((id) => {
          const selected = multiple ? !!values?.includes(id) : value === id;
          return (
            <Chip
              key={id}
              label={getClass(db, id)?.name ?? id}
              icon={selected ? 'checkmark' : 'people-outline'}
              selected={selected}
              onPress={() => {
                if (multiple) onChangeMany?.(selected ? (values ?? []).filter((v) => v !== id) : [...(values ?? []), id]);
                else onChange?.(id);
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
