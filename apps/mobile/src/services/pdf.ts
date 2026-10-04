import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatDate, subjectName, type EduLinkDatabase, type ReportCard, type SchoolDocument, type Student } from '@edulink/shared';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const shell = (title: string, body: string) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#172033;margin:32px}
  header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #2563EB;padding-bottom:12px;margin-bottom:20px}
  h1{font-size:22px;margin:0} h2{font-size:16px;margin:24px 0 8px;color:#2563EB}
  .muted{color:#667085;font-size:12px} table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{padding:8px;border-bottom:1px solid #E6EAF2;text-align:left} th{background:#F6F8FC}
  .avg{font-size:28px;font-weight:800;color:#7C3AED} .box{background:#F6F8FC;border-radius:10px;padding:12px;margin-top:8px}
  footer{margin-top:32px;font-size:11px;color:#98A2B3;text-align:center}
</style></head><body>${body}<footer>Document généré par EduLink — authenticité vérifiable auprès de l'établissement.</footer></body></html>`;

export function reportCardHtml(db: EduLinkDatabase, rc: ReportCard, student: Student): string {
  const rows = rc.subjects
    .map((s) => `<tr><td>${esc(subjectName(s.subjectId, 'fr'))}</td><td><b>${s.average.toFixed(1)}</b></td><td>${s.classAverage.toFixed(1)}</td><td>${esc(s.appreciation)}</td></tr>`)
    .join('');
  return shell(
    `Bulletin ${rc.period}`,
    `<header><div><h1>${esc(db.school.name)}</h1><div class="muted">${esc(db.school.address)}</div></div><div class="muted">Année ${rc.academicYear}</div></header>
     <h1>Bulletin — ${esc(rc.period)}</h1>
     <p><b>${esc(student.firstName)} ${esc(student.lastName)}</b> · Classe ${esc(rc.classLabel)} · N° ${esc(student.studentNumber)}</p>
     <p>Moyenne générale : <span class="avg">${rc.average.toFixed(1)}</span> / 20 &nbsp; <span class="muted">Classe : ${rc.classAverage.toFixed(1)}${rc.rank ? ` · Rang ${rc.rank}/${rc.classSize}` : ''}${rc.mention ? ` · ${esc(rc.mention)}` : ''}</span></p>
     <table><thead><tr><th>Matière</th><th>Moyenne</th><th>Classe</th><th>Appréciation</th></tr></thead><tbody>${rows}</tbody></table>
     <h2>Observation du conseil de classe</h2><div class="box">${esc(rc.teacherObservation)}</div>
     <h2>Mot de la direction</h2><div class="box">${esc(rc.principalComment)}</div>
     <p class="muted">Publié le ${formatDate(rc.publishedAt, 'fr', 'long')} — ${esc(db.school.principal)}</p>`,
  );
}

export function documentHtml(db: EduLinkDatabase, doc: SchoolDocument, student?: Student): string {
  return shell(
    doc.title,
    `<header><div><h1>${esc(db.school.name)}</h1><div class="muted">${esc(db.school.address)} · ${esc(db.school.phone)}</div></div><div class="muted">${formatDate(doc.date, 'fr', 'numeric')}</div></header>
     <h1>${esc(doc.title)}</h1>
     ${student ? `<p>Élève : <b>${esc(student.firstName)} ${esc(student.lastName)}</b> · N° ${esc(student.studentNumber)}</p>` : ''}
     <div class="box">Ce document est mis à disposition de façon sécurisée par ${esc(db.school.name)} via EduLink.</div>
     ${doc.signedAt ? `<p class="muted">Signé électroniquement le ${formatDate(doc.signedAt.slice(0, 10), 'fr', 'long')} à ${doc.signedAt.slice(11, 16)}.</p>` : ''}`,
  );
}

/** Generates the PDF and opens the share sheet (native) or the print dialog (web). */
export async function exportPdf(html: string, fileName: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName, UTI: 'com.adobe.pdf' });
  }
}
