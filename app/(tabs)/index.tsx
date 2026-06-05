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
  const { courses, currentWeek, loaded, init, setWeek } = useTimetable();

  useEffect(() => { init(); }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
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
        onCoursePress={(c: Course) => router.push({ pathname: '/course-detail', params: { id: c.id } })}
      />

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
