// 课程格子卡片组件
// 在当前周显示正常颜色，非本周显示淡色并标注"非本周"

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  isCurrentWeek: boolean;
  onPress: (course: Course) => void;
  isDark: boolean;
  compact?: boolean;
}

function CourseCard({ course, isCurrentWeek, onPress, isDark, compact }: CourseCardProps) {
  const opacity = isCurrentWeek ? 1 : 0.35;
  const bgColor = isCurrentWeek
    ? course.color + '20' // 半透明背景
    : 'transparent';
  const borderColor = course.color;
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subColor = isDark ? '#98989D' : '#8E8E93';

  if (compact) {
    // 紧凑模式（用于小格子）
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { opacity, borderLeftColor: borderColor, borderLeftWidth: 3 },
          !isCurrentWeek && styles.nonCurrentBorder,
        ]}
        onPress={() => onPress(course)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.compactName, { color: isCurrentWeek ? textColor : subColor }]}
          numberOfLines={1}
        >
          {course.name}
        </Text>
        {!isCurrentWeek && (
          <Text style={styles.nonWeekBadge}>非本周</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { opacity, backgroundColor: bgColor, borderLeftColor: borderColor, borderLeftWidth: 4 },
        !isCurrentWeek && styles.nonCurrentBorder,
      ]}
      onPress={() => onPress(course)}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.name, { color: isCurrentWeek ? textColor : subColor }]}
        numberOfLines={2}
      >
        {course.name}
      </Text>
      {course.location ? (
        <Text style={[styles.detail, { color: subColor }]} numberOfLines={1}>
          {course.location}
        </Text>
      ) : null}
      {course.teacher ? (
        <Text style={[styles.detail, { color: subColor }]} numberOfLines={1}>
          {course.teacher}
        </Text>
      ) : null}
      {!isCurrentWeek && (
        <Text style={styles.nonWeekBadge}>非本周</Text>
      )}
    </TouchableOpacity>
  );
}

export default memo(CourseCard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 2,
    borderRadius: 6,
    padding: 4,
    minHeight: 48,
    justifyContent: 'center',
  },
  compactContainer: {
    flex: 1,
    margin: 1,
    borderRadius: 4,
    padding: 2,
    minHeight: 28,
    justifyContent: 'center',
  },
  compactName: {
    fontSize: 10,
    fontWeight: '600',
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  detail: {
    fontSize: 9,
    marginTop: 1,
    lineHeight: 12,
  },
  nonCurrentBorder: {
    borderLeftColor: '#C8C8CC',
  },
  nonWeekBadge: {
    fontSize: 8,
    color: '#FF9500',
    fontWeight: '600',
    marginTop: 2,
  },
});
