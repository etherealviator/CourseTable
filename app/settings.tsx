import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTimetable } from '../src/features/timetable/store';

export default function SettingsScreen() {
  const router = useRouter();
  const { semesterStart, settings, setSemesterStart, updateSettings } = useTimetable();
  const [startDate, setStartDate] = useState(semesterStart || '');

  if (!settings) return null;

  const themeColor = settings.themeColor || '#4A90D9';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 20 }}>设置</Text>

          {/* 学期起始 */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 }}>学期起始日期</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              style={{ backgroundColor: '#f5f5f7', borderRadius: 8, padding: 12, fontSize: 15 }}
            />
            <TouchableOpacity
              onPress={() => setSemesterStart(startDate)}
              style={{ backgroundColor: themeColor, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>更新</Text>
            </TouchableOpacity>
          </View>

          {/* 开关 */}
          <View style={{ backgroundColor: '#f5f5f7', borderRadius: 12, padding: 4, marginBottom: 16 }}>
            <Row label="深色模式" value={settings.themeMode === 'dark'} onChange={(v) => updateSettings({ themeMode: v ? 'dark' : 'light' })} themeColor={themeColor} />
            <View style={{ height: 1, backgroundColor: '#e8e8e8', marginHorizontal: 16 }} />
            <Row label="显示周六日" value={settings.showWeekends} onChange={(v) => updateSettings({ showWeekends: v })} themeColor={themeColor} />
          </View>

          {/* 导入入口 */}
          <TouchableOpacity
            onPress={() => router.push('/import')}
            style={{ backgroundColor: themeColor, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>从教务系统导入课程表</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Row({ label, value, onChange, themeColor }: { label: string; value: boolean; onChange: (v: boolean) => void; themeColor: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 15, color: '#333' }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#ddd', true: themeColor }} />
    </View>
  );
}
