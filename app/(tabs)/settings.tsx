import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTimetable } from '../../src/features/timetable/store';

export default function SettingsScreen() {
  const router = useRouter();
  const { semesterStart, settings, setSemesterStart, updateSettings } = useTimetable();
  const [startDate, setStartDate] = useState(semesterStart || '');
  const isDark = settings?.themeMode === 'dark';

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
          style={{ backgroundColor: '#3B82F6', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 20 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>更新学期起始</Text>
        </TouchableOpacity>

        {/* 深色模式 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600' }}>深色模式</Text>
          <Switch
            value={isDark}
            onValueChange={(v) => updateSettings({ themeMode: v ? 'dark' : 'light' })}
          />
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
