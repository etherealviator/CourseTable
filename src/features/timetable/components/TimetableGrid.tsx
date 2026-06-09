import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Course } from '../../../shared/types';
import { CourseCard } from './CourseCard';
import { parsePeriodTimes } from '../../../shared/utils/time';

interface Props {
  courses: Course[];
  currentWeek: number;
  showWeekends: boolean;
  periodTimes: string[];
  onCoursePress: (course: Course) => void;
}

const GRID_H = 58;
const LABEL_W = 36;  // 缩窄

export function TimetableGrid({ courses, currentWeek, showWeekends, periodTimes, onCoursePress }: Props) {
  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const days = showWeekends ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
  const times = parsePeriodTimes(periodTimes);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row' }}>
        {/* 时间轴 — 只显示节次数字 */}
        <View style={{ width: LABEL_W, paddingTop: 4 }}>
          {times.map((t, i) => (
            <View key={i} style={{ height: GRID_H, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#999' }}>{i + 1}</Text>
              <Text style={{ fontSize: 7, color: '#ccc', marginTop: 1 }}>{t[0]}</Text>
            </View>
          ))}
        </View>

        {/* 课程列 */}
        {days.map(day => {
          const dayCourses = weekCourses.filter(c => c.dayOfWeek === day);
          return (
            <View key={day} style={{ flex: 1, borderLeftWidth: 1, borderColor: '#f0f0f0' }}>
              {times.map((_, periodIdx) => {
                const period = periodIdx + 1;
                const courseHere = dayCourses.find(c => c.startPeriod === period);
                if (courseHere) {
                  const span = courseHere.endPeriod - courseHere.startPeriod + 1;
                  return (
                    <View key={period} style={{ height: GRID_H * span - 2, marginBottom: 2 }}>
                      <CourseCard course={courseHere} unitH={GRID_H} span={span} onPress={onCoursePress} />
                    </View>
                  );
                }
                const spanned = dayCourses.find(c => c.startPeriod < period && c.endPeriod >= period);
                if (spanned) return null;
                return <View key={period} style={{ height: GRID_H - 2, marginBottom: 2 }} />;
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
