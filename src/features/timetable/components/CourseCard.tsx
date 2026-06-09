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
  return (
    <TouchableOpacity
      onPress={() => onPress(course)}
      activeOpacity={0.8}
      style={{
        flex: 1,
        backgroundColor: course.color,
        borderRadius: 6,
        padding: span >= 3 ? 8 : 5,
        justifyContent: 'flex-start',
      }}
    >
      <Text
        numberOfLines={span >= 3 ? 3 : span >= 2 ? 2 : 1}
        style={{
          fontSize: span >= 3 ? 12 : 11,
          fontWeight: '700',
          color: '#fff',
          lineHeight: span >= 3 ? 16 : 14,
        }}
      >
        {course.name}
      </Text>
      {course.location && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.8)',
            marginTop: 2,
          }}
        >
          {course.location}
        </Text>
      )}
    </TouchableOpacity>
  );
}
