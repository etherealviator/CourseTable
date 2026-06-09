import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Course } from '../../../shared/types';
import { CourseCard } from './CourseCard';
import { PERIOD_TIMES } from '../../../shared/utils/time';

interface Props {
  courses: Course[];
  currentWeek: number;
  showWeekends: boolean;
  onCoursePress: (course: Course) => void;
}

const GRID_H = 62;
const LABEL_W = 50;

export function TimetableGrid({ courses, currentWeek, showWeekends, onCoursePress }: Props) {
  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const days = showWeekends ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F5F7' }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', paddingRight: 6 }}>
        {/* 时间轴 */}
        <View style={{ width: LABEL_W, paddingTop: 0 }}>
          {PERIOD_TIMES.map((t, i) => (
            <View
              key={i}
              style={{
                height: GRID_H,
                justifyContent: 'flex-start',
                alignItems: 'center',
                paddingTop: 2,
              }}
            >
              <Text style={{ fontSize: 9, color: '#aaa', fontWeight: '600' }}>{t[0]}</Text>
              <View style={{ height: 1, width: 16, backgroundColor: '#ddd', marginVertical: 2 }} />
              <Text style={{ fontSize: 8, color: '#ccc' }}>{t[1]}</Text>
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
                    <View key={period} style={{ height: GRID_H * span - 3, marginBottom: 3 }}>
                      <CourseCard course={courseHere} unitH={GRID_H} span={span} onPress={onCoursePress} />
                    </View>
                  );
                }
                const spanned = dayCourses.find(c => c.startPeriod < period && c.endPeriod >= period);
                if (spanned) return null;

                return (
                  <View
                    key={period}
                    style={{
                      height: GRID_H - 3,
                      marginBottom: 3,
                      borderRadius: 6,
                      backgroundColor: day % 2 === 0 ? '#FAFAFA' : '#F8F8F8',
                    }}
                  />
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
