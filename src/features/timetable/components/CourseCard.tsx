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
  const height = periods * gridUnit - 4;

  return (
    <TouchableOpacity
      onPress={() => onPress(course)}
      activeOpacity={0.7}
      style={{
        backgroundColor: course.color + '22',
        borderLeftWidth: 3,
        borderLeftColor: course.color,
        borderRadius: 6,
        padding: 6,
        marginHorizontal: 2,
        marginVertical: 2,
        height: Math.max(height, 40),
        justifyContent: 'center',
      }}
    >
      <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: '#222' }}>
        {course.name}
      </Text>
      {course.location ? (
        <Text numberOfLines={1} style={{ fontSize: 9, color: '#666', marginTop: 2 }}>
          {course.location}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
