import { useEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { canViewStudent } from '@edulink/shared';
import { useStore } from '../../store/AppStore';

/** Deep link edulink://child/<id> — selects the child (if authorised) and opens the dashboard. */
export default function ChildLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, user, selectChild } = useStore();
  const allowed = !!user && canViewStudent(db, user, id);
  useEffect(() => {
    if (allowed) selectChild(id);
  }, [allowed, id, selectChild]);
  return <Redirect href="/(tabs)" />;
}
