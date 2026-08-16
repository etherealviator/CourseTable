import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Course } from '../../../shared/types';

interface Props {
  course: Course;
  unitH: number;
  span: number;
  dimmed?: boolean;
  onPress: (course: Course) => void;
}

export function CourseCard({ course, unitH, span, dimmed = false, onPress }: Props) {
  // 层级排布: 课程名(完整不省略) → 教师 → @教室
  const showTeacher = span >= 2;
  const showLocation = span >= 1;

  // 长按查看完整课程信息（灰色态也能看到完整课程名）
  const showFullInfo = () => {
    Alert.alert(
      course.name,
      [
        course.teacher ? `教师：${course.teacher}` : '',
        course.location ? `教室：${course.location}` : '',
        `节次：第${course.startPeriod}-${course.endPeriod}节`,
        `周次：${course.weeks.join(',')}`,
      ].filter(Boolean).join('\n'),
      [{ text: '查看详情', onPress: () => onPress(course) }, { text: '关闭', style: 'cancel' }]
    );
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(course)}
      onLongPress={showFullInfo}
      delayLongPress={300}
      activeOpacity={0.6}
      style={{
        flex: 1,
        backgroundColor: 'transparent',
        borderLeftWidth: 3,
        borderLeftColor: dimmed ? '#d0d0d0' : course.color,
        padding: 5,
        justifyContent: 'flex-start',
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      {/* 课程名 — 完整显示，不强制省略号 */}
      <Text
        numberOfLines={0}
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: dimmed ? '#999' : '#1a1a1a',
          lineHeight: 15,
        }}
      >
        {course.name}
      </Text>
      {showTeacher && course.teacher && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 9.5,
            color: dimmed ? '#bbb' : '#777',
            marginTop: 2,
            lineHeight: 12,
          }}
        >
          {course.teacher}
        </Text>
      )}
      {showLocation && course.location && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 10,
            color: dimmed ? '#bbb' : '#888',
            marginTop: 1,
            lineHeight: 13,
          }}
        >
          @{course.location}
        </Text>
      )}
    </TouchableOpacity>
  );
}
