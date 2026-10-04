import React from 'react';
import { useStore } from '../../store/AppStore';
import { ParentHome } from '../../features/home/ParentHome';
import { StudentHome } from '../../features/home/StudentHome';
import { TeacherHome } from '../../features/home/TeacherHome';
import { AdminHome } from '../../features/home/AdminHome';

export default function Home() {
  const { user } = useStore();
  switch (user?.role) {
    case 'student':
      return <StudentHome />;
    case 'teacher':
      return <TeacherHome />;
    case 'admin':
      return <AdminHome />;
    default:
      return <ParentHome />;
  }
}
