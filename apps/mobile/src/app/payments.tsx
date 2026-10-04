import React, { useState } from 'react';
import { View } from 'react-native';
import { formatDate, formatMoney, type Payment } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { PAYMENT_ICON } from '../lib/meta';
import { exportPdf } from '../services/pdf';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, Card, EmptyState, Icon, IconBadge, Pill, Row, SectionHeader } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { AnimatedNumber, FadeIn } from '../components/animated';

export default function Payments() {
  const { db, payPayment, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  const [paying, setPaying] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  if (!db.school.modules.payments) return <Screen title={t('payments.title')}><EmptyState title={t('payments.disabled')} /></Screen>;
  if (!student) return null;
  const all = db.payments.filter((p) => p.studentId === student.id).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const open = all.filter((p) => p.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const paid = all.filter((p) => p.status === 'paid');
  const due = open.reduce((s, p) => s + p.amount, 0);
  const paidTotal = paid.reduce((s, p) => s + p.amount, 0);
  const cur = db.school.currency;

  const statusPill = (p: Payment) =>
    p.status === 'paid' ? <Pill label={`✅ ${t('payments.status.paid')}`} tone="success" small /> : p.status === 'overdue' ? <Pill label={t('payments.status.overdue')} tone="error" icon="alert-circle" small /> : <Pill label={t('payments.status.pending')} tone="warning" icon="time-outline" small />;

  const Row1 = ({ p }: { p: Payment }) => (
    <Card>
      <Row style={{ alignItems: 'flex-start' }}>
        <IconBadge icon={PAYMENT_ICON[p.category].icon} color={c.primary} bg={c.primarySoft} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="label" tone="secondary">
            {t(PAYMENT_ICON[p.category].key)}
          </Txt>
          <Txt variant="bodyStrong">{p.label}</Txt>
          <Txt variant="caption" tone="secondary">
            {p.paidAt ? t('payments.paidOn', { date: formatDate(p.paidAt, locale, 'numeric') }) : t('payments.dueDate', { date: formatDate(p.dueDate, locale, 'numeric') })}
          </Txt>
          {statusPill(p)}
        </View>
        <Txt variant="heading">{formatMoney(p.amount, cur)}</Txt>
      </Row>
      {p.status === 'paid' && p.receiptNumber ? (
        <Button
          label={`${t('payments.receipt')} ${p.receiptNumber}`}
          icon="receipt-outline"
          variant="ghost"
          size="sm"
          full={false}
          onPress={() => exportPdf(`<h1>Reçu ${p.receiptNumber}</h1><p>${db.school.name}</p><p>${p.label} — ${formatMoney(p.amount, cur)}</p><p>Élève : ${student.firstName} ${student.lastName}</p><p>Payé le ${p.paidAt}</p>`, `Recu-${p.receiptNumber}.pdf`)}
        />
      ) : p.status !== 'paid' ? (
        <Button label={t('payments.pay')} icon="card-outline" size="sm" style={{ marginTop: space.md }} onPress={() => setPaying(p)} />
      ) : null}
    </Card>
  );

  return (
    <Screen title={t('payments.title')}>
      <ChildSwitcher />
      <FadeIn style={{ marginTop: space.lg }}>
        <Row gap={space.md}>
          <View style={{ flex: 1, borderRadius: radius.lg, padding: space.lg, backgroundColor: due ? c.warningSoft : c.successSoft }}>
            <Txt variant="caption" tone="secondary">
              {t('payments.due')}
            </Txt>
            <AnimatedNumber value={due} suffix={` ${cur}`} color={due ? c.warningText : c.successText} style={{ fontSize: 24 }} />
          </View>
          <View style={{ flex: 1, borderRadius: radius.lg, padding: space.lg, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }}>
            <Txt variant="caption" tone="secondary">
              {t('payments.paidTotal')}
            </Txt>
            <AnimatedNumber value={paidTotal} suffix={` ${cur}`} color={c.text} style={{ fontSize: 24 }} />
          </View>
        </Row>
      </FadeIn>
      {open.length ? (
        <>
          <SectionHeader title={t('payments.upcoming')} />
          <View style={{ gap: space.md }}>
            {open.map((p, i) => (
              <FadeIn key={p.id} index={i}>
                <Row1 p={p} />
              </FadeIn>
            ))}
          </View>
        </>
      ) : null}
      <SectionHeader title={t('payments.history')} />
      <View style={{ gap: space.md }}>
        {paid.map((p, i) => (
          <FadeIn key={p.id} index={i}>
            <Row1 p={p} />
          </FadeIn>
        ))}
      </View>

      <Sheet visible={!!paying} onClose={() => setPaying(null)} title={t('payments.pay')}>
        {paying ? (
          <>
            <Card>
              <Txt variant="bodyStrong">{paying.label}</Txt>
              <Txt variant="display" tone="primary" style={{ marginTop: 6 }}>
                {formatMoney(paying.amount, cur)}
              </Txt>
            </Card>
            <Row gap={8}>
              <Icon name="information-circle-outline" size={18} color={c.textSecondary} />
              <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
                {t('payments.demoPay')}
              </Txt>
            </Row>
            <Button
              label={`${t('payments.pay')} — ${formatMoney(paying.amount, cur)}`}
              icon="lock-closed"
              loading={busy}
              onPress={() => {
                setBusy(true);
                setTimeout(() => {
                  payPayment(paying.id);
                  setBusy(false);
                  setPaying(null);
                  showToast({ title: t('payments.title'), body: t('payments.success'), category: 'success' });
                }, 900);
              }}
            />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
