import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimetable } from '../features/timetable/store';
import { WeekHeader } from '../features/timetable/components/WeekHeader';
import { TimetableGrid } from '../features/timetable/components/TimetableGrid';
import type { Course } from '../shared/types';

export default function HomeScreen() {
  const { courses, currentWeek, loaded, init, setWeek } = useTimetable();

  useEffect(() => { init(); }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <WeekHeader
        currentWeek={currentWeek}
        onPrev={() => setWeek(Math.max(1, currentWeek - 1))}
        onNext={() => setWeek(currentWeek + 1)}
      />
      <TimetableGrid
        courses={courses}
        currentWeek={currentWeek}
        onCoursePress={(c: Course) => {
          // 将在后续实现课程详情导航
        }}
      />
    </SafeAreaView>
  );
}
