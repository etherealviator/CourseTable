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
        <View style={{ backgroundColor: '#F5F5F7', paddingBottom: 4 }}>
          <WeekHeader
            currentWeek={currentWeek}
            showWeekends={showWeekends}
            onPrev={() => setWeek(Math.max(1, currentWeek - 1))}
            onNext={() => setWeek(currentWeek + 1)}
            themeColor={themeColor}
          />
        </View>

        {isEmpty ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
            <Text style={{ fontSize: 16, color: '#999', marginBottom: 4 }}>本周没有课程</Text>
            <Text style={{ fontSize: 13, color: '#bbb' }}>点下方 + 添加课程，或从设置页导入</Text>
          </View>
        ) : (
          <TimetableGrid
            courses={courses}
            currentWeek={currentWeek}
            showWeekends={showWeekends}
            onCoursePress={(c: Course) => router.push({ pathname: '/course-detail', params: { id: c.id } })}
          />
        )}

        {/* 底部信息 */}
        <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: '#ccc' }}>
            {courses.length} 门课 · 第 {currentWeek} 周
            {!isEmpty && ` · ${weekCourses.length} 门本周`}
          </Text>
        </View>

        {/* FAB */}
        <TouchableOpacity
          onPress={() => router.push('/course/add')}
          activeOpacity={0.8}
          style={{
            position: 'absolute', bottom: 24, right: 20,
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: themeColor,
            alignItems: 'center', justifyContent: 'center',
            elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 26, lineHeight: 28 }}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
