// 课程表周视图网格
// 7天 × 12节 布局，当前天高亮，当前周课程正常，非本周淡色

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Course } from '../types';
import { WEEKDAY_NAMES, PERIOD_TIMES, LIGHT_THEME, DARK_THEME } from '../constants/theme';
import CourseCard from './CourseCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIME_COL_WIDTH = 36;
const DAY_COL_WIDTH = (SCREEN_WIDTH - TIME_COL_WIDTH) / 7;

interface TimetableGridProps {
  courses: Course[];
  currentWeek: number;
  todayDay: number;
  onCoursePress: (course: Course) => void;
  isDark: boolean;
}

function TimetableGrid({
  courses,
  currentWeek,
  todayDay,
  onCoursePress,
  isDark,
}: TimetableGridProps) {
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const maxPeriod = 12;

  // 构建课程位置映射: key = `${day}-${period}`
  const courseMap = useMemo(() => {
    const map: Record<string, Course> = {};
    for (const course of courses) {
      // 只处理当前查看周的课程（或者非本周但有课的）
      const isThisWeek = course.weeks.includes(currentWeek);
      // 检查课程是否在当前周有课，或在其他周有课
      const displayWeek = isThisWeek ? currentWeek : (course.weeks[0] || currentWeek);

      for (let p = course.startPeriod; p <= course.endPeriod; p++) {
        const key = `${course.dayOfWeek}-${p}-${course.id}`;
        map[key] = course;
      }
    }
    return map;
  }, [courses, currentWeek]);

  // 获取某天某节次占用该格子的第一个课程
  const getCourseForSlot = (day: number, period: number): Course | null => {
    // 查找所有该天该节次的课程
    const matching = courses.filter(c =>
      c.dayOfWeek === day &&
      c.startPeriod <= period &&
      c.endPeriod >= period
    );
    if (matching.length === 0) return null;

    // 优先显示当前周有课的
    const thisWeek = matching.find(c => c.weeks.includes(currentWeek));
    if (thisWeek) return thisWeek;

    // 否则返回第一个非本周课程
    return matching[0];
  };

  // 判断某个格子是否是课程块的起始格
  const isStartCell = (course: Course, day: number, period: number): boolean => {
    return course.dayOfWeek === day && course.startPeriod === period;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 表头：星期 */}
      <View style={[styles.headerRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.timeCell, { borderRightColor: theme.border }]} />
        {WEEKDAY_NAMES.map((name, idx) => {
          const dayNum = idx + 1;
          const isToday = dayNum === todayDay;
          return (
            <View
              key={name}
              style={[
                styles.dayHeader,
                { borderRightColor: theme.border },
                isToday && { backgroundColor: theme.todayBg },
              ]}
            >
              <Text style={[
                styles.dayText,
                { color: isToday ? theme.primary : theme.textSecondary },
                isToday && { fontWeight: '700' },
              ]}>
                {name}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 课表主体 */}
      <ScrollView
        style={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {Array.from({ length: maxPeriod }, (_, i) => {
          const period = i + 1;
          return (
            <View
              key={period}
              style={[
                styles.periodRow,
                { borderBottomColor: theme.border },
              ]}
            >
              {/* 节次列 */}
              <View style={[styles.timeCell, { borderRightColor: theme.border, backgroundColor: theme.surface }]}>
                <Text style={[styles.periodText, { color: theme.textSecondary }]}>
                  {period}
                </Text>
              </View>

              {/* 每天的格子 */}
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const day = dayIdx + 1;
                const course = getCourseForSlot(day, period);
                const isToday = day === todayDay;

                if (!course) {
                  return (
                    <View
                      key={`${day}-${period}`}
                      style={[
                        styles.cell,
                        { borderRightColor: theme.border },
                        isToday && { backgroundColor: theme.todayBg + '40' },
                      ]}
                    />
                  );
                }

                // 只在课程起始格渲染卡片
                if (!isStartCell(course, day, period)) {
                  return (
                    <View
                      key={`${day}-${period}`}
                      style={[
                        styles.cell,
                        { borderRightColor: theme.border },
                      ]}
                    />
                  );
                }

                const isCurrentWeek = course.weeks.includes(currentWeek);

                return (
                  <View
                    key={`${day}-${period}`}
                    style={[
                      styles.cell,
                      { borderRightColor: theme.border },
                      isToday && { backgroundColor: theme.todayBg + '40' },
                    ]}
                  >
                    <CourseCard
                      course={course}
                      isCurrentWeek={isCurrentWeek}
                      onPress={onCoursePress}
                      isDark={isDark}
                      compact
                    />
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default memo(TimetableGrid);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  timeCell: {
    width: TIME_COL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  dayHeader: {
    width: DAY_COL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollBody: {
    flex: 1,
  },
  periodRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
  },
  periodText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cell: {
    width: DAY_COL_WIDTH,
    minHeight: 38,
    borderRightWidth: StyleSheet.hairlineWidth,
    padding: 1,
  },
});
