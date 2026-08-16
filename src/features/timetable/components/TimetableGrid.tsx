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
  isDark: boolean;
  onCoursePress: (course: Course) => void;
  onEmptyPress: (day: number, period: number) => void;
  onEditTime: (periodIndex: number, current: string) => void;
}

const GRID_H = 60;
const LABEL_W = 48;

export function TimetableGrid({
  courses, currentWeek, showWeekends, periodTimes, semesterStarted, isDark,
  onCoursePress, onEmptyPress, onEditTime,
}: Props) {
  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const days = showWeekends ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
  const times = parsePeriodTimes(periodTimes);
  const bg = isDark ? '#1C1C1E' : '#fff';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row' }}>
        {/* 时间轴 — 点按时间数字原地编辑 */}
        <View style={{ width: LABEL_W, paddingTop: 4 }}>
          {times.map((t, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.5}
              onPress={() => onEditTime(i, periodTimes[i] || `${t[0]}-${t[1]}`)}
              style={{ height: GRID_H, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}
            >
              <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#aaa' : '#888' }}>{i + 1}</Text>
              <Text style={{ fontSize: 8, color: isDark ? '#777' : '#bbb', marginTop: 1 }}>{t[0]}</Text>
              <Text style={{ fontSize: 8, color: isDark ? '#666' : '#ccc' }}>{t[1]}</Text>
            </TouchableOpacity>
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
                // 空白格：透明与页面一体，点击添加课程（预填星期/节次）
                return (
                  <TouchableOpacity
                    key={period}
                    activeOpacity={0.5}
                    onPress={() => onEmptyPress(day, period)}
                    style={{ height: GRID_H - 2, marginBottom: 2 }}
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
