import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { childrenOf, formatDate, studentForUser, type DocumentCategory, type SchoolDocument } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { DOCUMENT_ICON } from '../lib/meta';
import { documentHtml, exportPdf } from '../services/pdf';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, Card, Chip, Icon, IconBadge, Pill, Row, SectionHeader } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { SignaturePad } from '../components/SignaturePad';
import { FadeIn } from '../components/animated';
import { ChildSwitcher } from '../components/ChildSwitcher';

const CATS: ('all' | DocumentCategory)[] = ['all', 'report_card', 'certificate', 'rules', 'authorization', 'timetable', 'invoice', 'pedagogical'];

export default function Documents() {
  const { db, user, signDocument, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  const [cat, setCat] = useState<'all' | DocumentCategory>('all');
  const [viewing, setViewing] = useState<SchoolDocument | null>(null);
  const [signing, setSigning] = useState<SchoolDocument | null>(null);
  const [sig, setSig] = useState<string | null>(null);
  if (!user) return null;

  const kids = user.role === 'parent' ? childrenOf(db, user.id) : user.role === 'student' ? [studentForUser(db, user.id)!] : [];
  // Documents of the selected child only: nominative ones, their class's, and school-wide ones.
  const focus = student ?? kids[0];
  const visible = focus ? db.documents.filter((d) => (d.studentId ? d.studentId === focus.id : !d.classIds || d.classIds.includes(focus.classId))) : [];
  const docs = visible.filter((d) => cat === 'all' || d.category === cat);
  const toSign = visible.filter((d) => d.requiresSignature && !d.signedAt);

  const download = async (d: SchoolDocument) => {
    await exportPdf(documentHtml(db, d, d.studentId ? kids.find((k) => k.id === d.studentId) : student ?? undefined), `${d.title}.pdf`);
    showToast({ title: d.title, body: t('documents.generated'), category: 'success' });
  };

  const DocRow = ({ d }: { d: SchoolDocument }) => (
    <Card onPress={() => setViewing(d)}>
      <Row>
        <IconBadge icon={DOCUMENT_ICON[d.category]} color={c.primary} bg={c.primarySoft} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong" numberOfLines={2}>
            {d.title}
          </Txt>
          <Txt variant="caption" tone="secondary">
            {t(`documents.cat.${d.category}`)} · {formatDate(d.date, locale, 'short')} · {d.fileType.toUpperCase()} {d.size}
          </Txt>
          {d.requiresSignature ? d.signedAt ? <Pill label={t('common.signed')} tone="success" icon="checkmark-circle" small /> : <Pill label={t('documents.toSign')} tone="warning" icon="create-outline" small /> : null}
        </View>
        <Pressable onPress={() => download(d)} accessibilityRole="button" accessibilityLabel={`${t('common.download')} ${d.title}`} hitSlop={8} style={{ padding: 8 }}>
          <Icon name="download-outline" size={22} color={c.primary} />
        </Pressable>
      </Row>
    </Card>
  );

  return (
    <Screen title={t('documents.title')} subtitle={focus ? `${focus.firstName} ${focus.lastName}` : undefined}>
      {user.role === 'parent' ? <View style={{ marginBottom: space.lg }}><ChildSwitcher /></View> : null}
      {toSign.length && user.role === 'parent' ? (
        <>
          <SectionHeader title={`${t('documents.toSign')} (${toSign.length})`} style={{ marginTop: 0 }} />
          <View style={{ gap: space.md }}>
            {toSign.map((d) => (
              <Card key={d.id} tone="warning">
                <Row>
                  <IconBadge icon="create" color={c.warningText} bg={c.card} />
                  <Txt variant="bodyStrong" style={{ flex: 1 }}>
                    {d.title}
                  </Txt>
                </Row>
                <Button label={t('common.sign')} icon="create-outline" style={{ marginTop: space.md }} onPress={() => { setSig(null); setSigning(d); }} />
              </Card>
            ))}
          </View>
        </>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: space.lg }}>
        {CATS.map((k) => (
          <Chip key={k} label={t(`documents.cat.${k}`)} selected={cat === k} onPress={() => setCat(k)} />
        ))}
      </ScrollView>
      <View style={{ gap: space.md }}>
        {docs.map((d, i) => (
          <FadeIn key={d.id} index={i}>
            <DocRow d={d} />
          </FadeIn>
        ))}
      </View>
      <Row gap={6} style={{ marginTop: space.lg }}>
        <Icon name="lock-closed" size={14} color={c.successText} />
        <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
          {t('documents.secure')}
        </Txt>
      </Row>

      <Sheet visible={!!viewing} onClose={() => setViewing(null)} title={viewing?.title}>
        {viewing ? (
          <>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: space.lg, borderWidth: 1, borderColor: c.border, gap: 8 }}>
              <Txt variant="label" color="#2563EB">
                {db.school.name}
              </Txt>
              <Txt variant="heading" color="#172033">
                {viewing.title}
              </Txt>
              <View style={{ height: 1, backgroundColor: '#E6EAF2' }} />
              {[0.9, 0.75, 0.82, 0.6].map((w, i) => (
                <View key={i} style={{ height: 8, width: `${w * 100}%`, borderRadius: 4, backgroundColor: '#EEF2F9' }} />
              ))}
              <Txt variant="caption" color="#667085">
                {formatDate(viewing.date, locale, 'long')}
                {viewing.sharedBy ? ` · ${t('documents.sharedBy', { name: viewing.sharedBy })}` : ''}
              </Txt>
            </View>
            <Button label={t('common.download')} icon="download-outline" onPress={() => download(viewing)} />
            {viewing.requiresSignature && !viewing.signedAt && user.role === 'parent' ? <Button label={t('common.sign')} variant="soft" icon="create-outline" onPress={() => { setSigning(viewing); setViewing(null); setSig(null); }} /> : null}
          </>
        ) : null}
      </Sheet>

      <Sheet visible={!!signing} onClose={() => setSigning(null)} title={t('signature.title')}>
        <Txt variant="bodyStrong">{signing?.title}</Txt>
        <SignaturePad onChange={setSig} />
        <Button
          label={t('signature.submit')}
          icon="checkmark-done"
          disabled={!sig}
          onPress={() => {
            if (!signing) return;
            signDocument(signing.id);
            setSigning(null);
            showToast({ title: t('signature.title'), body: t('signature.done'), category: 'success' });
          }}
        />
      </Sheet>
    </Screen>
  );
}
