// Tab 布局 — 2 Tab：课程表 + 设置

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}>{icon}</Text>
      <Text style={[styles.tabLabel, { opacity: focused ? 1 : 0.5, fontWeight: focused ? '600' : '400' }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const border = isDark ? '#38383A' : '#E5E5EA';
  const inactive = isDark ? '#98989D' : '#8E8E93';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: bg, borderTopColor: border, height: 52, paddingBottom: 4, paddingTop: 2 },
        tabBarActiveTintColor: '#4A90D9',
        tabBarInactiveTintColor: inactive,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📅" label="课程表" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" label="设置" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  tabLabel: { fontSize: 10, marginTop: 1 },
});
