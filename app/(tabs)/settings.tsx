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
  const [editTimes, setEditTimes] = useState(false);

  if (!settings) return null;

  const themeColor = settings.themeColor || '#4A90D9';
  const periodTimes = settings.periodTimes ?? [];
  // 补齐到12节
  while (periodTimes.length < 12) {
    periodTimes.push(`${8 + periodTimes.length}:00-${8 + periodTimes.length}:45`);
  }

  const handleTimeChange = (idx: number, val: string) => {
    const updated = [...periodTimes];
    updated[idx] = val;
    // 自动扩展
    while (updated.length < 12) {
      const i = updated.length;
      updated.push(`${8 + i}:00-${8 + i}:45`);
    }
    updateSettings({ periodTimes: updated });
  };

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
            <Row label="深色模式" value={settings.themeMode === 'dark'} onChange={(v) => updateSettings({ themeMode: v ? 'dark' : 'light' })} />
            <View style={{ height: 1, backgroundColor: '#e8e8e8', marginHorizontal: 16 }} />
            <Row label="显示周六日" value={settings.showWeekends} onChange={(v) => updateSettings({ showWeekends: v })} />
          </View>

          {/* 主题色 */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 10 }}>主题色</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {THEME_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => updateSettings({ themeColor: c })}
                  style={{
                    width: 34, height: 34, borderRadius: 17, backgroundColor: c,
                    borderWidth: themeColor === c ? 2.5 : 0,
                    borderColor: '#fff',
                  }}
                />
              ))}
            </View>
          </View>

          {/* 上课时间设置 */}
          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity onPress={() => setEditTimes(!editTimes)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#666' }}>⏰ 上课时间段</Text>
              <Text style={{ fontSize: 11, color: themeColor }}>{editTimes ? '收起' : '编辑'}</Text>
            </TouchableOpacity>

            {editTimes && (
              <View style={{ marginTop: 8, backgroundColor: '#f5f5f7', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>格式: HH:MM-HH:MM，例如 08:00-08:45</Text>
                {periodTimes.slice(0, 12).map((t, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ width: 50, fontSize: 13, color: '#666' }}>第{i+1}节</Text>
                    <TextInput
                      value={t}
                      onChangeText={(v) => handleTimeChange(i, v)}
                      style={{
                        flex: 1, backgroundColor: '#fff', borderRadius: 6,
                        paddingHorizontal: 10, paddingVertical: 6, fontSize: 13,
                      }}
                      autoCapitalize="none"
                    />
                  </View>
                ))}
              </View>
            )}
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

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 15, color: '#333' }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#ddd', true: '#4A90D9' }} />
    </View>
  );
}
