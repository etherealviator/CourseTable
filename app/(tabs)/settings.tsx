import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTimetable } from '../../src/features/timetable/store';

const THEME_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function SettingsScreen() {
  const router = useRouter();
  const { semesterStart, settings, setSemesterStart, updateSettings } = useTimetable();
  const [startDate, setStartDate] = useState(semesterStart || '');

  if (!settings) return null;

  const isDark = settings.themeMode === 'dark';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 20 }}>设置</Text>

        {/* 学期起始 */}
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6 }}>学期起始日期</Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 6 }}
        />
        <TouchableOpacity
          onPress={() => { setSemesterStart(startDate); }}
          style={{ backgroundColor: settings.themeColor || '#3B82F6', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 20 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>更新学期起始</Text>
        </TouchableOpacity>

        {/* 深色模式 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600' }}>深色模式</Text>
          <Switch
            value={isDark}
            onValueChange={(v) => updateSettings({ themeMode: v ? 'dark' : 'light' })}
          />
        </View>

        {/* 周六日开关 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600' }}>显示周六日</Text>
          <Switch
            value={settings.showWeekends}
            onValueChange={(v) => updateSettings({ showWeekends: v })}
          />
        </View>

        {/* 主题色 */}
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>主题色</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {THEME_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => updateSettings({ themeColor: c })}
              style={{
                width: 36, height: 36, borderRadius: 18, backgroundColor: c,
                borderWidth: (settings.themeColor || '#3B82F6') === c ? 3 : 0,
                borderColor: '#fff',
              }}
            />
          ))}
        </View>

        {/* 数据概要 */}
        <View style={{ backgroundColor: '#f5f5f7', borderRadius: 8, padding: 12, marginBottom: 20 }}>
          <Text style={{ fontSize: 13, color: '#666' }}>学期周数：{settings.totalWeeks} 周</Text>
        </View>

        {/* 教务导入入口 */}
        <TouchableOpacity
          onPress={() => router.push('/import')}
          style={{ backgroundColor: '#10B981', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>从教务系统导入课程表</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
