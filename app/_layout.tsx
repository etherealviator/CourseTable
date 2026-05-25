// 根布局 - 提供 Paper 主题和全局状态

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { loadSettings, AppSettings } from '../src/utils/storage';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4A90D9',
    background: '#F5F5F7',
    surface: '#FFFFFF',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5DA0E8',
    background: '#000000',
    surface: '#1C1C1E',
  },
};

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      const settings: AppSettings = await loadSettings();
      if (settings.darkMode === 'auto') {
        setIsDark(systemScheme === 'dark');
      } else {
        setIsDark(settings.darkMode === 'dark');
      }
    })();
  }, [systemScheme]);

  return (
    <PaperProvider theme={isDark ? darkTheme : lightTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="course-detail"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: '课程详情',
          }}
        />
        <Stack.Screen
          name="import"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: '导入课程表',
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
