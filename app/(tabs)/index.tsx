import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StatusBar } from 'react-native';
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
  const { courses, currentWeek, loaded, init, setWeek, settings, semesterStart } = useTimetable();
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

  const started = isSemesterStarted(semesterStart);
  const todayLabel = getTodayDateLabel();
  const startLabel = getStartDateLabel(semesterStart);
  const daysUntil = getDaysUntil(semesterStart);
  const dayDates = getWeekDayDates(semesterStart, currentWeek);

  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const isEmpty = weekCourses.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
          onPrev={() => setWeek(Math.max(1, currentWeek - 1))}
          onNext={() => setWeek(currentWeek + 1)}
          onAdd={() => router.push('/course/add')}
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
            onCoursePress={(c: Course) => router.push({ pathname: '/course-detail', params: { id: c.id } })}
            onEmptyPress={(day: number, period: number) =>
              router.push({ pathname: '/course/add', params: { dayOfWeek: String(day), startPeriod: String(period), endPeriod: String(period) } })
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
