import { getClass, getStudent, type Conversation, type EduLinkDatabase } from '@edulink/shared';

/** Conversations are stored once; each participant sees the *other* person's name. */
export function conversationTitle(db: EduLinkDatabase, conv: Conversation, viewerId: string): { title: string; subtitle: string; color: string } {
  const other = db.users.find((u) => u.id === conv.participantIds.find((p) => p !== viewerId));
  if (other?.role === 'parent') {
    const student = conv.studentId ? getStudent(db, conv.studentId) : undefined;
    const cls = student ? getClass(db, student.classId) : undefined;
    return {
      title: `${other.title ?? ''} ${other.firstName} ${other.lastName}`.trim(),
      subtitle: student ? `Parent de ${student.firstName} · ${cls?.name ?? ''}` : 'Parent',
      color: other.avatarColor,
    };
  }
  return { title: conv.title, subtitle: conv.subtitle, color: conv.avatarColor };
}
