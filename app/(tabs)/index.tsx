import React, { useEffect, useState } from 'react';
import {
  View, TouchableOpacity, Text, ActivityIndicator, StatusBar, Switch, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTimetable } from '../../src/features/timetable/store';
import { WeekHeader } from '../../src/features/timetable/components/WeekHeader';
import { TimetableGrid } from '../../src/features/timetable/components/TimetableGrid';
import {
  isSemesterStarted, getTodayDateLabel, getStartDateLabel, getWeekDayDates, getDaysUntil,
} from '../../src/shared/utils/time';
import type { Course } from '../../src/shared/types';

export default function HomeScreen() {
  const router = useRouter();
  const {
    courses, currentWeek, loaded, init, setWeek, settings, semesterStart, setSemesterStart, updateSettings,
  } = useTimetable();
  const showWeekends = settings?.showWeekends ?? true;
  const themeColor = settings?.themeColor || '#4A90D9';
  const isDark = settings?.themeMode === 'dark';
  const periodTimes = settings?.periodTimes ?? [];

  // 就近编辑状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [timeEditIdx, setTimeEditIdx] = useState<number | null>(null);
  const [timeEditVal, setTimeEditVal] = useState('');
  const [startInput, setStartInput] = useState('');

  useEffect(() => { init(); }, []);
  useEffect(() => { setStartInput(semesterStart); }, [semesterStart, loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#1C1C1E' : '#fff' }}>
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  const bg = isDark ? '#1C1C1E' : '#fff';
  const started = isSemesterStarted(semesterStart);
  const todayLabel = getTodayDateLabel();
  const startLabel = getStartDateLabel(semesterStart);
  const daysUntil = getDaysUntil(semesterStart);
  const dayDates = getWeekDayDates(semesterStart, currentWeek);

  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const isEmpty = weekCourses.length === 0;

  const openTimeEdit = (idx: number, current: string) => {
    setTimeEditIdx(idx);
    setTimeEditVal(current);
  };

  const saveTimeEdit = () => {
    if (timeEditIdx === null) return;
    if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeEditVal.trim())) {
      alert('格式应为 HH:MM-HH:MM，例如 08:00-08:45');
      return;
    }
    const next = [...periodTimes];
    while (next.length <= timeEditIdx) next.push(`0${next.length}:00-0${next.length}:45`);
    next[timeEditIdx] = timeEditVal.trim();
    updateSettings({ periodTimes: next });
    setTimeEditIdx(null);
  };

  const sheetBg = isDark ? '#2C2C2E' : '#fff';
  const sheetText = isDark ? '#eee' : '#333';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <WeekHeader
          currentWeek={currentWeek}
          totalWeeks={settings?.totalWeeks || 20}
          showWeekends={showWeekends}
          semesterStarted={started}
          startLabel={startLabel}
          todayLabel={todayLabel}
          daysUntil={daysUntil}
          dayDates={dayDates}
          isDark={isDark}
          onPrev={() => setWeek(Math.max(1, currentWeek - 1))}
          onNext={() => setWeek(currentWeek + 1)}
          onAdd={() => router.push('/course/add')}
          onMenu={() => setMenuVisible(true)}
        />

        {isEmpty ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📅</Text>
            <Text style={{ fontSize: 15, color: '#999' }}>本周没有课程</Text>
          </View>
        ) : (
          <TimetableGrid
            courses={courses}
            currentWeek={currentWeek}
            showWeekends={showWeekends}
            periodTimes={periodTimes}
            semesterStarted={started}
            isDark={isDark}
            onCoursePress={(c: Course) => router.push({ pathname: '/course-detail', params: { id: c.id } })}
            onEmptyPress={(day: number, period: number) =>
              router.push({ pathname: '/course/add', params: { dayOfWeek: String(day), startPeriod: String(period), endPeriod: String(period) } })
            }
            onEditTime={openTimeEdit}
          />
        )}
      </SafeAreaView>

      {/* ⋮ 菜单：高频开关 + 学期日期 */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={{ backgroundColor: sheetBg, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: sheetText, marginBottom: 12 }}>快捷设置</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 15, color: sheetText }}>深色模式</Text>
              <Switch
                value={isDark}
                onValueChange={(v) => updateSettings({ themeMode: v ? 'dark' : 'light' })}
                trackColor={{ false: '#ddd', true: themeColor }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 15, color: sheetText }}>显示周六日</Text>
              <Switch
                value={showWeekends}
                onValueChange={(v) => updateSettings({ showWeekends: v })}
                trackColor={{ false: '#ddd', true: themeColor }}
              />
            </View>

            <Text style={{ fontSize: 13, color: isDark ? '#888' : '#666', marginTop: 10, marginBottom: 4 }}>学期起始日期</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={startInput}
                onChangeText={setStartInput}
                placeholder="YYYY-MM-DD"
                style={{
                  flex: 1, backgroundColor: isDark ? '#1C1C1E' : '#f5f5f7', borderRadius: 8,
                  paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: sheetText,
                }}
              />
              <TouchableOpacity
                onPress={() => { setSemesterStart(startInput); setMenuVisible(false); }}
                style={{ backgroundColor: themeColor, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>应用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 时间轴就近编辑 */}
      <Modal visible={timeEditIdx !== null} transparent animationType="fade" onRequestClose={() => setTimeEditIdx(null)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setTimeEditIdx(null)}
        >
          <View style={{ backgroundColor: sheetBg, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: sheetText, marginBottom: 4 }}>
              第 {timeEditIdx !== null ? timeEditIdx + 1 : ''} 节上课时间
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#888' : '#999', marginBottom: 10 }}>格式 HH:MM-HH:MM，例如 08:00-08:45</Text>
            <TextInput
              value={timeEditVal}
              onChangeText={setTimeEditVal}
              placeholder="08:00-08:45"
              autoCapitalize="none"
              style={{
                backgroundColor: isDark ? '#1C1C1E' : '#f5f5f7', borderRadius: 8,
                paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: sheetText, marginBottom: 12,
              }}
            />
            <TouchableOpacity
              onPress={saveTimeEdit}
              style={{ backgroundColor: themeColor, borderRadius: 8, padding: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>保存</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
