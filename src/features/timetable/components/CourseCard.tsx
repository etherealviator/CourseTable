import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Course } from '../../../shared/types';

interface Props {
  course: Course;
  unitH: number;
  span: number;
  onPress: (course: Course) => void;
}

export function CourseCard({ course, unitH, span, onPress }: Props) {
  const bgColor = course.color + '18';
  const textColor = course.color;

  return (
    <TouchableOpacity
      onPress={() => onPress(course)}
      activeOpacity={0.75}
      style={{
        flex: 1,
        backgroundColor: bgColor,
        borderRadius: 8,
        padding: span >= 3 ? 8 : 5,
        justifyContent: 'flex-start',
        elevation: 1,
        shadowColor: course.color,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      }}
    >
      <Text
        numberOfLines={span >= 3 ? 3 : span >= 2 ? 2 : 1}
        style={{
          fontSize: span >= 3 ? 12 : 11,
          fontWeight: '700',
          color: textColor,
          lineHeight: span >= 3 ? 16 : 14,
        }}
      >
        {course.name}
      </Text>
      {course.location && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: span >= 3 ? 10 : 9,
            color: textColor + 'aa',
            marginTop: span >= 3 ? 4 : 2,
          }}
        >
          {course.location}
        </Text>
      )}
      {course.teacher && span >= 2 && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 9,
            color: textColor + '88',
            marginTop: 1,
          }}
        >
          {course.teacher}
        </Text>
      )}
    </TouchableOpacity>
  );
}
