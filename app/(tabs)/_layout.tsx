// Tab 布局 - 底部导航

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

function TabIcon({ name, label, focused, color }: { name: string; label: string; focused: boolean; color: import('react-native').ColorValue }) {
  const icons: Record<string, string> = {
    timetable: '📅',
    courses: '📚',
    settings: '⚙️',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.icon, { opacity: focused ? 1 : 0.5 }]}>{icons[name] || '📌'}</Text>
      <Text style={[styles.tabLabel, { color, fontWeight: focused ? '600' : '400' }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderTopColor: isDark ? '#38383A' : '#E5E5EA',
          height: 56,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#4A90D9',
        tabBarInactiveTintColor: isDark ? '#98989D' : '#8E8E93',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="timetable" label="课程表" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="courses" label="课程" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="settings" label="设置" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 1,
  },
});
