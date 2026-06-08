import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTimetable } from '../../src/features/timetable/store';
import { WeekHeader } from '../../src/features/timetable/components/WeekHeader';
import { TimetableGrid } from '../../src/features/timetable/components/TimetableGrid';
import type { Course } from '../../src/shared/types';

export default function HomeScreen() {
  const router = useRouter();
  const { courses, currentWeek, loaded, init, setWeek, settings } = useTimetable();
  const showWeekends = settings?.showWeekends ?? true;

  useEffect(() => { init(); }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const handleEmptyPress = (dayOfWeek: number, period: number) => {
    router.push({ pathname: '/course/add', params: { dayOfWeek: String(dayOfWeek), startPeriod: String(period), endPeriod: String(Math.min(period + 1, 12)) } });
  };

  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <WeekHeader
        currentWeek={currentWeek}
        showWeekends={showWeekends}
        onPrev={() => setWeek(Math.max(1, currentWeek - 1))}
        onNext={() => setWeek(currentWeek + 1)}
      />
      <TimetableGrid
        courses={courses}
        currentWeek={currentWeek}
        showWeekends={showWeekends}
        onCoursePress={(c: Course) => router.push({ pathname: '/course-detail', params: { id: c.id } })}
        onEmptyPress={handleEmptyPress}
      />

      {/* 左下角课程计数 */}
      <View style={{ position: 'absolute', bottom: 24, left: 16 }}>
        <Text style={{ fontSize: 12, color: '#aaa' }}>
          {weekCourses.length}门课 · 第{currentWeek}周
        </Text>
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/course/add')}
        style={{
          position: 'absolute', bottom: 24, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
          elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 28, lineHeight: 30 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
