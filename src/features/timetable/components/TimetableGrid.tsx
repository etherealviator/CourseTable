import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Course } from '../../../shared/types';
import { CourseCard } from './CourseCard';
import { PERIOD_TIMES } from '../../../shared/utils/time';

interface Props {
  courses: Course[];
  currentWeek: number;
  onCoursePress: (course: Course) => void;
}

const GRID_UNIT = 52;
const LABEL_WIDTH = 36;

export function TimetableGrid({ courses, currentWeek, onCoursePress }: Props) {
  const weekCourses = courses.filter(c => c.weeks.includes(currentWeek));
  const isCurrentWeekActive = currentWeek > 0;

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row' }}>
        {/* 节次标签列 */}
        <View style={{ width: LABEL_WIDTH }}>
          {PERIOD_TIMES.map((_, i) => (
            <View key={i} style={{ height: GRID_UNIT, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
              <Text style={{ fontSize: 9, color: '#999' }}>{i + 1}</Text>
            </View>
          ))}
        </View>

        {/* 7天课程网格 */}
        {[1, 2, 3, 4, 5, 6, 7].map(day => {
          const dayCourses = weekCourses.filter(c => c.dayOfWeek === day);
          return (
            <View key={day} style={{ flex: 1, borderLeftWidth: 1, borderColor: '#eee' }}>
              {PERIOD_TIMES.map((_, periodIdx) => {
                const period = periodIdx + 1;
                // 检查该时间段是否有课程在此开始
                const courseHere = dayCourses.find(c => c.startPeriod === period);
                if (courseHere) {
                  const span = courseHere.endPeriod - courseHere.startPeriod + 1;
                  return (
                    <View key={period} style={{ height: GRID_UNIT * span }}>
                      <CourseCard course={courseHere} gridUnit={GRID_UNIT} onPress={onCoursePress} />
                    </View>
                  );
                }
                // 检查是否有课程跨越此时间段（已被上面的 startPeriod 覆盖）
                const spanned = dayCourses.find(c => c.startPeriod < period && c.endPeriod >= period);
                if (spanned) return null;

                return (
                  <View key={period} style={{ height: GRID_UNIT, borderTopWidth: 1, borderColor: '#f5f5f5' }} />
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
