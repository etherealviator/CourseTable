import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StatusBar, Platform } from 'react-native';
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
  const themeColor = settings?.themeColor || '#4A90D9';

  useEffect(() => { init(); }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' }}>
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const isEmpty = weekCourses.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F7" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* 周切换 */}
        <WeekHeader
          currentWeek={currentWeek}
          showWeekends={showWeekends}
          onPrev={() => setWeek(Math.max(1, currentWeek - 1))}
          onNext={() => setWeek(currentWeek + 1)}
          themeColor={themeColor}
        />

        {isEmpty ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
            <Text style={{ fontSize: 15, color: '#999', marginBottom: 4 }}>本周没有课程安排</Text>
            <Text style={{ fontSize: 12, color: '#ccc' }}>点右下角 + 添加课程</Text>
          </View>
        ) : (
          <TimetableGrid
            courses={courses}
            currentWeek={currentWeek}
            showWeekends={showWeekends}
            onCoursePress={(c: Course) => router.push({ pathname: '/course-detail', params: { id: c.id } })}
          />
        )}

        {/* 统计 + FAB */}
        <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: '#ccc' }}>
            {courses.length} 门课 · 第 {currentWeek} 周
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/course/add')}
          activeOpacity={0.8}
          style={{
            position: 'absolute', bottom: 24, right: 20,
            width: 50, height: 50, borderRadius: 25,
            backgroundColor: themeColor,
            alignItems: 'center', justifyContent: 'center',
            elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 24, lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
