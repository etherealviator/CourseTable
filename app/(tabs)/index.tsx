// 课程表主页 - 周视图

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WeekHeader from '../../src/components/WeekHeader';
import TimetableGrid from '../../src/components/TimetableGrid';
import { useCourses } from '../../src/hooks/useCourses';
import { Course } from '../../src/types';

export default function TimetableScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';

  const {
    courses,
    currentWeek,
    todayDay,
    loaded,
    changeWeek,
  } = useCourses();

  const allWeeks = useMemo(() => {
    const maxWeek = Math.max(20, ...courses.flatMap(c => c.weeks));
    return Math.max(maxWeek, 20);
  }, [courses]);

  const handlePrevWeek = useCallback(() => {
    if (currentWeek > 1) changeWeek(currentWeek - 1);
  }, [currentWeek, changeWeek]);

  const handleNextWeek = useCallback(() => {
    if (currentWeek < allWeeks) changeWeek(currentWeek + 1);
  }, [currentWeek, allWeeks, changeWeek]);

  const handleCoursePress = useCallback((course: Course) => {
    router.push({
      pathname: '/course-detail',
      params: { courseId: course.id },
    });
  }, [router]);

  if (!loaded) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F5F5F7' }]} />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F5F5F7' }]}>
      <View style={{ paddingTop: insets.top }}>
        <WeekHeader
          currentWeek={currentWeek}
          totalWeeks={allWeeks}
          todayDay={todayDay}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          isDark={isDark}
        />
      </View>

      <TimetableGrid
        courses={courses}
        currentWeek={currentWeek}
        todayDay={todayDay}
        onCoursePress={handleCoursePress}
        isDark={isDark}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => router.push('/course-detail')}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#4A90D9',
    borderRadius: 28,
  },
});
