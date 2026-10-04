import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { formatDate, stampNow, timeToMinutes, type Attachment } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { conversationTitle } from '../../lib/conversations';
import { Txt } from '../../components/Txt';
import { Avatar, Icon, IconButton, Row } from '../../components/ui';
import { CONTENT_MAX_WIDTH } from '../../components/Screen';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, user, sendMessage, markConversationRead, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<Attachment | undefined>();
  const scroll = useRef<ScrollView>(null);

  const conv = db.conversations.find((cv) => cv.id === id);
  const messages = useMemo(() => db.messages.filter((m) => m.conversationId === id).sort((a, b) => a.sentAt.localeCompare(b.sentAt)), [db.messages, id]);

  useEffect(() => {
    markConversationRead(id);
  }, [id, messages.length, markConversationRead]);

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
  }, [messages.length]);

  if (!conv || !user || !conv.participantIds.includes(user.id)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <Txt>{t('messages.notAllowed')}</Txt>
      </View>
    );
  }
  const view = conversationTitle(db, conv, user.id);
  const policy = db.school.messaging;

  const attach = async (kind: 'image' | 'document') => {
    const res = await DocumentPicker.getDocumentAsync({ type: kind === 'image' ? 'image/*' : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: false });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setPending({ id: `att-${Date.now()}`, name: a.name, kind: kind === 'image' ? 'image' : 'pdf', size: a.size ? `${Math.max(1, Math.round(a.size / 1024))} Ko` : undefined });
  };

  const send = () => {
    const body = text.trim();
    if (!body && !pending) return;
    sendMessage(conv.id, body || pending!.name, pending);
    setText('');
    setPending(undefined);
    const now = timeToMinutes(stampNow().slice(11, 16));
    const { start, end } = policy.quietHours;
    if (now >= timeToMinutes(start) || now < timeToMinutes(end)) {
      showToast({ title: t('messages.title'), body: t('messages.quietHours', { start, end }), category: 'info' });
    }
  };

  let lastDay = '';
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + space.sm, paddingBottom: space.md, paddingHorizontal: space.lg, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Row style={{ maxWidth: CONTENT_MAX_WIDTH, width: '100%', alignSelf: 'center' }}>
          <IconButton icon="arrow-back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/messages'))} />
          <Avatar name={view.title} color={view.color} size={42} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" numberOfLines={1}>
              {view.title}
            </Txt>
            <Txt variant="caption" tone="secondary" numberOfLines={1}>
              {view.subtitle}
            </Txt>
          </View>
          <Icon name="lock-closed" size={16} color={c.successText} />
        </Row>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg, gap: 6, maxWidth: CONTENT_MAX_WIDTH, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignSelf: 'center', backgroundColor: c.backgroundAlt, borderRadius: radius.md, padding: space.sm, marginBottom: space.md, maxWidth: 320 }}>
          <Txt variant="caption" tone="secondary" align="center">
            🔒 {t('messages.secure')}
          </Txt>
        </View>
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          const day = m.sentAt.slice(0, 10);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <View key={m.id}>
              {showDay ? (
                <Txt variant="caption" tone="tertiary" align="center" style={{ marginVertical: space.sm }}>
                  {formatDate(day, locale, 'weekday')}
                </Txt>
              ) : null}
              <View
                accessible
                accessibilityLabel={`${mine ? 'Vous' : view.title}: ${m.body}. ${m.sentAt.slice(11, 16)}${mine ? `, ${m.readAt ? t('messages.read') : t('messages.sent')}` : ''}`}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  backgroundColor: mine ? c.primary : c.card,
                  borderWidth: mine ? 0 : 1,
                  borderColor: c.border,
                  borderRadius: 20,
                  borderBottomEndRadius: mine ? 6 : 20,
                  borderBottomStartRadius: mine ? 20 : 6,
                  paddingHorizontal: space.md,
                  paddingVertical: 10,
                  gap: 6,
                }}
              >
                {m.attachment ? (
                  <Row gap={10} style={{ backgroundColor: mine ? 'rgba(255,255,255,0.16)' : c.backgroundAlt, borderRadius: radius.sm, padding: 10 }}>
                    <Icon name={m.attachment.kind === 'image' ? 'image' : 'document-text'} size={22} color={mine ? '#FFFFFF' : c.primary} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="captionStrong" color={mine ? '#FFFFFF' : c.text} numberOfLines={1}>
                        {m.attachment.name}
                      </Txt>
                      {m.attachment.size ? (
                        <Txt variant="caption" color={mine ? 'rgba(255,255,255,0.8)' : c.textSecondary}>
                          {m.attachment.size}
                        </Txt>
                      ) : null}
                    </View>
                    <Icon name="download-outline" size={18} color={mine ? '#FFFFFF' : c.primary} />
                  </Row>
                ) : null}
                {m.body && m.body !== m.attachment?.name ? (
                  <Txt variant="body" color={mine ? (c.mode === 'dark' ? '#0B1220' : '#FFFFFF') : c.text}>
                    {m.body}
                  </Txt>
                ) : null}
                <Row gap={4} style={{ alignSelf: 'flex-end' }}>
                  <Txt variant="caption" color={mine ? 'rgba(255,255,255,0.8)' : c.textTertiary} style={{ fontSize: 11 }}>
                    {m.sentAt.slice(11, 16)}
                  </Txt>
                  {mine ? <Icon name={m.readAt ? 'checkmark-done' : 'checkmark'} size={14} color={m.readAt ? '#A7F3D0' : 'rgba(255,255,255,0.8)'} /> : null}
                  {mine ? (
                    <Txt variant="caption" color="rgba(255,255,255,0.8)" style={{ fontSize: 11 }}>
                      {m.readAt ? t('messages.read') : t('messages.sent')}
                    </Txt>
                  ) : null}
                </Row>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: insets.bottom + space.sm, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
        <View style={{ maxWidth: CONTENT_MAX_WIDTH, width: '100%', alignSelf: 'center', gap: 8 }}>
          {pending ? (
            <Row gap={8} style={{ backgroundColor: c.primarySoft, borderRadius: radius.sm, padding: 8 }}>
              <Icon name="attach" size={18} color={c.primary} />
              <Txt variant="captionStrong" tone="primary" style={{ flex: 1 }} numberOfLines={1}>
                {pending.name}
              </Txt>
              <Pressable onPress={() => setPending(undefined)} accessibilityRole="button" accessibilityLabel={t('common.cancel')} hitSlop={8}>
                <Icon name="close" size={18} color={c.primary} />
              </Pressable>
            </Row>
          ) : null}
          <Row gap={6}>
            {policy.attachments ? (
              <>
                <IconButton icon="image-outline" label={t('messages.attachImage')} onPress={() => attach('image')} size={42} />
                <IconButton icon="document-attach-outline" label={t('messages.attachDocument')} onPress={() => attach('document')} size={42} />
              </>
            ) : null}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('messages.placeholder')}
              placeholderTextColor={c.textTertiary}
              accessibilityLabel={t('messages.placeholder')}
              multiline
              style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, backgroundColor: c.backgroundAlt, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, color: c.text, fontSize: 15, textAlign: isRTL ? 'right' : 'left', fontFamily: isRTL ? undefined : 'PlusJakartaSans_500Medium', outlineStyle: 'none' } as never}
            />
            {text.trim() || pending ? (
              <IconButton icon="send" label={t('common.send')} onPress={send} tone="soft" size={44} />
            ) : (
              <IconButton
                icon="mic-outline"
                label={db.school.modules.voiceMessages ? 'Message vocal' : t('messages.voiceDisabled')}
                onPress={() => showToast({ title: t('messages.title'), body: t('messages.voiceDisabled'), category: 'info' })}
                size={44}
              />
            )}
          </Row>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
