import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { ADAM_ID, getClass, getStudent, SARAH_ID, stampNow } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Card, Chip, EmptyState, IconBadge, Pill, Row, Segmented, SectionHeader } from '../../components/ui';

/** A tiny deterministic "QR" drawing for the badge preview. */
function FakeQr({ seed, size = 132 }: { seed: string; size?: number }) {
  const n = 21;
  const cell = size / n;
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      const on = finder ? (x % 6 === 0 || y % 6 === 0 || (x % 7 > 1 && x % 7 < 5 && y % 7 > 1 && y % 7 < 5) || (x > 13 && (x - 14) % 6 === 0) || (y > 13 && (y - 14) % 6 === 0)) : ((h >> ((x * 7 + y * 3) % 31)) & 1) === 1 && (x + y) % 3 !== 0;
      if (on) cells.push(<Rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#172033" />);
    }
  return (
    <Svg width={size} height={size} style={{ backgroundColor: '#FFFFFF' }}>
      {cells}
    </Svg>
  );
}

export default function CheckIn() {
  const { db, user, checkIn, showToast } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const [kind, setKind] = useState<'entry' | 'exit'>('entry');
  const [method, setMethod] = useState<'qr' | 'rfid' | 'nfc' | 'badge'>('qr');
  const [studentId, setStudentId] = useState(SARAH_ID);
  const [log, setLog] = useState<{ name: string; kind: string; time: string; method: string }[]>([]);
  if (user?.role !== 'admin' || !db.school.modules.qrCheckIn) return <Screen title={t('checkin.title')}><EmptyState icon="lock-closed-outline" title={t('messages.notAllowed')} /></Screen>;
  const picks = [SARAH_ID, ADAM_ID, ...db.students.filter((s) => s.classId === 'cls-6-b').slice(0, 4).map((s) => s.id)].filter((v, i, a) => a.indexOf(v) === i);
  const s = getStudent(db, studentId)!;

  return (
    <Screen title={t('checkin.title')}>
      <Txt variant="body" tone="secondary">
        {t('checkin.intro')}
      </Txt>
      <View style={{ marginTop: space.lg, gap: space.md }}>
        <Segmented value={kind} onChange={setKind} options={[{ value: 'entry', label: `➡️ ${t('checkin.entry')}` }, { value: 'exit', label: `⬅️ ${t('checkin.exit')}` }]} />
        <Txt variant="captionStrong" tone="secondary">
          {t('checkin.method')}
        </Txt>
        <Row gap={8} wrap>
          {(['qr', 'rfid', 'nfc', 'badge'] as const).map((m) => (
            <Chip key={m} label={t(`attendance.source.${m}`)} selected={method === m} onPress={() => setMethod(m)} />
          ))}
        </Row>
        <Txt variant="captionStrong" tone="secondary">
          {t('checkin.pick')}
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {picks.map((id) => {
            const st = getStudent(db, id)!;
            return <Chip key={id} label={`${st.firstName} ${st.lastName.charAt(0)}. · ${getClass(db, st.classId)?.name}`} selected={studentId === id} onPress={() => setStudentId(id)} />;
          })}
        </ScrollView>
      </View>

      <Card style={{ marginTop: space.xl, alignItems: 'center', gap: space.md }}>
        <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: radius.md, borderWidth: 1, borderColor: c.border }}>
          <FakeQr seed={s.studentNumber} />
        </View>
        <Txt variant="heading">
          {s.firstName} {s.lastName}
        </Txt>
        <Pill label={`${s.studentNumber} · ${getClass(db, s.classId)?.name}`} tone="info" small />
        <Button
          label={t('checkin.scan')}
          icon="scan-outline"
          onPress={() => {
            const time = checkIn(studentId, kind, method);
            const k = kind === 'entry' ? t('checkin.entry') : t('checkin.exit');
            setLog((p) => [{ name: `${s.firstName} ${s.lastName}`, kind: k, time, method: t(`attendance.source.${method}`) }, ...p]);
            showToast({ title: t('checkin.title'), body: t('checkin.done', { name: s.firstName, kind: k.toLowerCase(), time }), category: 'success' });
          }}
        />
      </Card>

      <SectionHeader title={t('checkin.recent')} />
      {log.length ? (
        <Card style={{ gap: space.md }}>
          {log.map((l, i) => (
            <Row key={i}>
              <IconBadge icon={l.kind === t('checkin.entry') ? 'log-in-outline' : 'log-out-outline'} color={c.successText} bg={c.successSoft} size={36} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{l.name}</Txt>
                <Txt variant="caption" tone="secondary">
                  {l.kind} · {l.method}
                </Txt>
              </View>
              <Pill label={l.time} tone="neutral" small />
            </Row>
          ))}
        </Card>
      ) : (
        <Txt variant="caption" tone="tertiary">
          {stampNow().slice(0, 10)}
        </Txt>
      )}
    </Screen>
  );
}
