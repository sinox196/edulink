import React from 'react';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useStore } from '../../store/AppStore';
import { TabBar } from '../../components/TabBar';

export default function TabsLayout() {
  const { session, ready } = useStore();
  if (ready && !session) return <Redirect href="/login" />;
  return (
    <Tabs screenOptions={{ headerShown: false, animation: 'shift' }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="school" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
