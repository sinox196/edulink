import { useEffect, useMemo, useState } from 'react';
import {
  attendanceFor,
  attendanceOn,
  attendanceStats,
  generalAverage,
  getClass,
  homeworkFor,
  subjectSummaries,
  upcomingExams,
  type Student,
} from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';

/** Simulated first fetch so that skeleton states are visible, as on a real network. */
export function useInitialLoad(ms = 550): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

/** "Présent(e)" → "Présente" / "Présent" depending on the student's gender (fr & ar). */
export function genderize(text: string, gender: 'F' | 'M' | undefined): string {
  return text.replace(/\((e|ت|ة)\)/g, (_, suffix: string) => (gender === 'F' ? suffix : ''));
}

/** Derived data for the selected child, memoised per database snapshot. */
export function useStudentData(override?: Student | null) {
  const { db } = useStore();
  const current = useCurrentStudent();
  const student = override === undefined ? current : override;
  return useMemo(() => {
    if (!student) return null;
    const records = attendanceFor(db, student.id);
    return {
      student,
      cls: getClass(db, student.classId)!,
      today: attendanceOn(db, student.id),
      attendance: records,
      stats: attendanceStats(records),
      average: generalAverage(db, student.id),
      subjects: subjectSummaries(db, student.id),
      homework: homeworkFor(db, student.id),
      exams: upcomingExams(db, student.classId),
    };
  }, [db, student]);
}

export function useUnreadCount(): number {
  const { db, user } = useStore();
  return useMemo(() => (user ? db.notifications.filter((n) => n.userId === user.id && !n.read).length : 0), [db.notifications, user]);
}
