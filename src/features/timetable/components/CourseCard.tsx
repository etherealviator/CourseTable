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
  // 根据跨节数决定显示多少信息
  const showDetail = span >= 2;

  return (
    <TouchableOpacity
      onPress={() => onPress(course)}
      activeOpacity={0.7}
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 6,
        marginHorizontal: 1,
        marginVertical: 1,
        borderLeftWidth: 3,
        borderLeftColor: course.color,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        padding: 6,
        justifyContent: 'flex-start',
      }}
    >
      <Text
        numberOfLines={span >= 3 ? 2 : 1}
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: '#1a1a1a',
          lineHeight: 16,
        }}
      >
        {course.name}
      </Text>
      {showDetail && course.location && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 10,
            color: '#888',
            marginTop: 3,
          }}
        >
          {course.location}
        </Text>
      )}
      {span >= 3 && course.teacher && (
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
