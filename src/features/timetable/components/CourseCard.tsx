import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Course } from '../../../shared/types';

interface Props {
  course: Course;
  gridUnit: number;
  onPress: (course: Course) => void;
}

export function CourseCard({ course, gridUnit, onPress }: Props) {
  const periods = course.endPeriod - course.startPeriod + 1;
  const height = periods * gridUnit - 6;

  return (
    <TouchableOpacity
      onPress={() => onPress(course)}
      activeOpacity={0.75}
      style={{
        backgroundColor: course.color + '18',
        borderRadius: 8,
        padding: 6,
        height: Math.max(height, 38),
        justifyContent: 'flex-start',
        borderLeftWidth: 0,
        elevation: 1,
        shadowColor: course.color,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
      }}
    >
      <Text numberOfLines={2} style={{ fontSize: 11, fontWeight: '700', color: course.color, lineHeight: 14 }}>
        {course.name}
      </Text>
      {course.location ? (
        <Text numberOfLines={1} style={{ fontSize: 9, color: course.color + 'aa', marginTop: 2 }}>
          {course.location}
        </Text>
      ) : null}
      {course.teacher && periods <= 2 ? (
        <Text numberOfLines={1} style={{ fontSize: 8, color: course.color + '88', marginTop: 1 }}>
          {course.teacher}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
