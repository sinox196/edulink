import React from 'react';
import { ScrollView, View } from 'react-native';
import { childrenOf, getClass } from '@edulink/shared';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { useI18n } from '../i18n/I18nProvider';
import { Txt } from './Txt';
import { Avatar, Icon, PressableScale } from './ui';

/** Elegant child selector — switching updates every screen of the app. */
export function ChildSwitcher({ onDark }: { onDark?: boolean }) {
  const { db, user, selectedChildId, selectChild, showToast } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  if (!user || user.role !== 'parent') return null;
  const kids = childrenOf(db, user.id);
  if (kids.length < 2) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} accessibilityRole="tablist" accessibilityLabel={t('child.switch')}>
      {kids.map((k) => {
        const selected = k.id === selectedChildId;
        const cls = getClass(db, k.classId);
        const bg = onDark ? (selected ? '#FFFFFF' : 'rgba(255,255,255,0.14)') : selected ? c.card : 'transparent';
        const fg = onDark ? (selected ? '#172033' : '#FFFFFF') : c.text;
        return (
          <PressableScale
            key={k.id}
            onPress={() => {
              if (selected) return;
              selectChild(k.id);
              showToast({ title: t('child.switch'), body: t('child.selected', { name: k.firstName }), category: 'info' });
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${k.firstName}, ${cls?.name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 7,
              paddingStart: 7,
              paddingEnd: 14,
              borderRadius: radius.pill,
              backgroundColor: bg,
              borderWidth: 1,
              borderColor: onDark ? 'rgba(255,255,255,0.22)' : selected ? c.primary : c.border,
            }}
          >
            <Avatar name={`${k.firstName} ${k.lastName}`} color={k.avatarColor} size={34} emoji={k.gender === 'F' ? '👧' : '👦'} />
            <View>
              <Txt variant="captionStrong" color={fg}>
                {k.firstName}
              </Txt>
              <Txt variant="caption" color={onDark ? (selected ? '#667085' : 'rgba(255,255,255,0.75)') : c.textSecondary} style={{ fontSize: 12, lineHeight: 15 }}>
                {cls?.name}
              </Txt>
            </View>
            {selected ? <Icon name="checkmark-circle" size={18} color={onDark ? c.primary : c.primary} /> : null}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}
