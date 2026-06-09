import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTimetable } from '../../src/features/timetable/store';

const THEME_COLORS = ['#4A90D9', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function SettingsScreen() {
  const router = useRouter();
  const { semesterStart, settings, setSemesterStart, updateSettings } = useTimetable();
  const [startDate, setStartDate] = useState(semesterStart || '');

  if (!settings) return null;

  const themeColor = settings.themeColor || '#4A90D9';

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 20 }}>设置</Text>

          {/* 学期起始 */}
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 }}>学期起始日期</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              style={{ backgroundColor: '#F5F5F7', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 8 }}
            />
            <TouchableOpacity
              onPress={() => { setSemesterStart(startDate); }}
              style={{ backgroundColor: themeColor, borderRadius: 8, padding: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>更新</Text>
            </TouchableOpacity>
          </View>

          {/* 开关组 */}
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 12 }}>
            <SettingRow label="深色模式" value={settings.themeMode === 'dark'} onValueChange={(v) => updateSettings({ themeMode: v ? 'dark' : 'light' })} />
            <View style={{ height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16 }} />
            <SettingRow label="显示周六日" value={settings.showWeekends} onValueChange={(v) => updateSettings({ showWeekends: v })} />
          </View>

          {/* 主题色 */}
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 12 }}>主题色</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {THEME_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => updateSettings({ themeColor: c })}
                  style={{
                    width: 36, height: 36, borderRadius: 18, backgroundColor: c,
                    borderWidth: themeColor === c ? 3 : 0, borderColor: '#fff',
                    elevation: themeColor === c ? 2 : 0,
                  }}
                />
              ))}
            </View>
          </View>

          {/* 数据概览 */}
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#666' }}>学期周数：{settings.totalWeeks} 周</Text>
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

function SettingRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 15, color: '#333' }}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#ddd', true: '#4A90D9' }} />
    </View>
  );
}
