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
  const longCourse = span >= 3;

  return (
    <TouchableOpacity
      onPress={() => onPress(course)}
      activeOpacity={0.7}
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginHorizontal: 2,
        marginVertical: 1,
        padding: longCourse ? 8 : 5,
        borderLeftWidth: 3,
        borderLeftColor: course.color,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        justifyContent: 'flex-start',
      }}
    >
      <Text
        numberOfLines={longCourse ? 3 : span >= 2 ? 2 : 1}
        style={{
          fontSize: longCourse ? 13 : 11,
          fontWeight: '600',
          color: '#1a1a1a',
          lineHeight: longCourse ? 17 : 14,
        }}
      >
        {course.name}
      </Text>
      {course.location && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: longCourse ? 10 : 9,
            color: '#888',
            marginTop: longCourse ? 4 : 2,
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
            color: '#aaa',
            marginTop: 1,
          }}
        >
          {course.teacher}
        </Text>
      )}
    </TouchableOpacity>
  );
}
