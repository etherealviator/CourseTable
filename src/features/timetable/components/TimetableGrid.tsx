import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Course } from '../../../shared/types';
import { CourseCard } from './CourseCard';
import { PERIOD_TIMES } from '../../../shared/utils/time';

interface Props {
  courses: Course[];
  currentWeek: number;
  showWeekends: boolean;
  onCoursePress: (course: Course) => void;
}

const GRID_UNIT = 60;
const LABEL_WIDTH = 32;

export function TimetableGrid({ courses, currentWeek, showWeekends, onCoursePress }: Props) {
  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const days = showWeekends ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', paddingRight: 4 }}>
        {/* 节次标签 */}
        <View style={{ width: LABEL_WIDTH, paddingTop: 2 }}>
          {PERIOD_TIMES.map((t, i) => (
            <View key={i} style={{ height: GRID_UNIT, justifyContent: 'flex-start', alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: '#bbb', fontWeight: '500' }}>{i + 1}</Text>
            </View>
          ))}
        </View>

        {/* 天列 */}
        {days.map(day => {
          const dayCourses = weekCourses.filter(c => c.dayOfWeek === day);
          return (
            <View key={day} style={{ flex: 1, marginHorizontal: 1 }}>
              {PERIOD_TIMES.map((_, periodIdx) => {
                const period = periodIdx + 1;
                const courseHere = dayCourses.find(c => c.startPeriod === period);
                if (courseHere) {
                  const span = courseHere.endPeriod - courseHere.startPeriod + 1;
                  return (
                    <View key={period} style={{ height: GRID_UNIT * span - 2, marginBottom: 2 }}>
                      <CourseCard course={courseHere} gridUnit={GRID_UNIT} onPress={onCoursePress} />
                    </View>
                  );
                }
                const spanned = dayCourses.find(c => c.startPeriod < period && c.endPeriod >= period);
                if (spanned) return null;

                // 空白时段 — 纯白背景，无加号
                return (
                  <View key={period} style={{ height: GRID_UNIT - 2, marginBottom: 2, borderRadius: 4, backgroundColor: '#FAFAFA' }} />
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
