import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Course } from '../../../shared/types';
import { CourseCard } from './CourseCard';
import { parsePeriodTimes } from '../../../shared/utils/time';

interface Props {
  courses: Course[];
  currentWeek: number;
  showWeekends: boolean;
  periodTimes: string[];
  semesterStarted: boolean;
  onCoursePress: (course: Course) => void;
  onEmptyPress: (day: number, period: number) => void;
}

const GRID_H = 58;
const LABEL_W = 46;

export function TimetableGrid({ courses, currentWeek, showWeekends, periodTimes, semesterStarted, onCoursePress, onEmptyPress }: Props) {
  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const days = showWeekends ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
  const times = parsePeriodTimes(periodTimes);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row' }}>
        {/* 时间轴 — 显示完整时间段 08:00-08:45 */}
        <View style={{ width: LABEL_W, paddingTop: 4 }}>
          {times.map((t, i) => (
            <View key={i} style={{ height: GRID_H, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#888' }}>{i + 1}</Text>
              <Text style={{ fontSize: 8, color: '#bbb', marginTop: 1 }}>{t[0]}</Text>
              <Text style={{ fontSize: 8, color: '#ccc' }}>{t[1]}</Text>
            </View>
          ))}
        </View>

        {/* 课程列 */}
        {days.map(day => {
          const dayCourses = weekCourses.filter(c => c.dayOfWeek === day);
          return (
            <View key={day} style={{ flex: 1 }}>
              {times.map((_, periodIdx) => {
                const period = periodIdx + 1;
                const courseHere = dayCourses.find(c => c.startPeriod === period);
                if (courseHere) {
                  const span = courseHere.endPeriod - courseHere.startPeriod + 1;
                  return (
                    <View key={period} style={{ height: GRID_H * span - 2, marginBottom: 2 }}>
                      <CourseCard course={courseHere} unitH={GRID_H} span={span} onPress={onCoursePress} dimmed={!semesterStarted} />
                    </View>
                  );
                }
                const spanned = dayCourses.find(c => c.startPeriod < period && c.endPeriod >= period);
                if (spanned) return null;
                // 空白格：点击添加课程（预填星期/节次）
                return (
                  <TouchableOpacity
                    key={period}
                    activeOpacity={0.5}
                    onPress={() => onEmptyPress(day, period)}
                    style={{ height: GRID_H - 2, marginBottom: 2, borderWidth: 0.5, borderColor: '#f0f0f0', borderRadius: 4 }}
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
