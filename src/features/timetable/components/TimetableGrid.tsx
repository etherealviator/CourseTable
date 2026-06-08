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
  onEmptyPress?: (dayOfWeek: number, period: number) => void;
}

const GRID_UNIT = 68;
const LABEL_WIDTH = 36;

export function TimetableGrid({ courses, currentWeek, showWeekends, onCoursePress, onEmptyPress }: Props) {
  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const days = showWeekends ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row' }}>
        {/* 节次标签列 */}
        <View style={{ width: LABEL_WIDTH }}>
          {PERIOD_TIMES.map((t, i) => (
            <View key={i} style={{ height: GRID_UNIT, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
              <Text style={{ fontSize: 9, color: '#999' }}>{i + 1}</Text>
              <Text style={{ fontSize: 7, color: '#ccc' }}>{t[0]}</Text>
            </View>
          ))}
        </View>

        {/* 课程网格 */}
        {days.map(day => {
          const dayCourses = weekCourses.filter(c => c.dayOfWeek === day);
          return (
            <View key={day} style={{ flex: 1, borderLeftWidth: 1, borderColor: '#eee' }}>
              {PERIOD_TIMES.map((_, periodIdx) => {
                const period = periodIdx + 1;
                const courseHere = dayCourses.find(c => c.startPeriod === period);
                if (courseHere) {
                  const span = courseHere.endPeriod - courseHere.startPeriod + 1;
                  return (
                    <View key={period} style={{ height: GRID_UNIT * span }}>
                      <CourseCard course={courseHere} gridUnit={GRID_UNIT} onPress={onCoursePress} />
                    </View>
                  );
                }
                const spanned = dayCourses.find(c => c.startPeriod < period && c.endPeriod >= period);
                if (spanned) return null;

                return (
                  <TouchableOpacity
                    key={period}
                    style={{ height: GRID_UNIT, borderTopWidth: 1, borderColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={0.5}
                    onPress={() => onEmptyPress?.(day, period)}
                  >
                    {onEmptyPress && <Text style={{ fontSize: 14, color: '#ddd' }}>+</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
