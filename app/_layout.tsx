import React, { useEffect, Component } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTimetable } from '../src/features/timetable/store';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const lightTheme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: '#4A90D9', background: '#F5F5F7', surface: '#FFFFFF' },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, primary: '#5DA0E8', background: '#000000', surface: '#1C1C1E' },
};

// ── Error Boundary ──
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>出错了</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const { settings } = useTimetable();
  const isDark = settings?.themeMode === 'auto'
    ? systemScheme === 'dark'
    : settings?.themeMode === 'dark';

  useEffect(() => { SplashScreen.hideAsync(); }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={isDark ? darkTheme : lightTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="course-detail" options={{ presentation: 'modal', headerShown: true, headerTitle: '课程详情' }} />
            <Stack.Screen name="import" options={{ presentation: 'modal', headerShown: true, headerTitle: '导入课程表' }} />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
