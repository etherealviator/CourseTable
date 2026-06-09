import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StatusBar } from 'react-native';
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
  const periodTimes = settings?.periodTimes ?? [];

  useEffect(() => { init(); }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const isEmpty = weekCourses.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <WeekHeader
          currentWeek={currentWeek}
          showWeekends={showWeekends}
          onPrev={() => setWeek(Math.max(1, currentWeek - 1))}
          onNext={() => setWeek(currentWeek + 1)}
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
            onCoursePress={(c: Course) => router.push({ pathname: '/course-detail', params: { id: c.id } })}
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          onPress={() => router.push('/course/add')}
          activeOpacity={0.8}
          style={{
            position: 'absolute', bottom: 24, right: 20,
            width: 50, height: 50, borderRadius: 25,
            backgroundColor: themeColor,
            alignItems: 'center', justifyContent: 'center',
            elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 24, lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
