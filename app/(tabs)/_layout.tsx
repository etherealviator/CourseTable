// Tab 布局 — 只保留课程表（底部栏隐藏，设置改为齿轮呼出）

import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // 隐藏底部栏：设置已整合到齿轮呼出栏
        tabBarStyle: { display: 'none' },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" />
    </Tabs>
  );
}
