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
  const showDetail = span >= 2;

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
      activeOpacity={0.7}
      style={{
        flex: 1,
        backgroundColor: dimmed ? '#fafafa' : '#fff',
        borderRadius: 6,
        marginHorizontal: 1,
        marginVertical: 1,
        borderLeftWidth: 3,
        borderLeftColor: dimmed ? '#d0d0d0' : course.color,
        elevation: dimmed ? 0 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        padding: 5,
        justifyContent: 'flex-start',
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <Text
        numberOfLines={3}
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: dimmed ? '#999' : '#1a1a1a',
          lineHeight: 15,
        }}
      >
        {course.name}
      </Text>
      {showDetail && course.location && (
        <Text
          numberOfLines={2}
          style={{
            fontSize: 10,
            color: dimmed ? '#bbb' : '#888',
            marginTop: 2,
            lineHeight: 13,
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
            color: dimmed ? '#ccc' : '#aaa',
            marginTop: 1,
          }}
        >
          {course.teacher}
        </Text>
      )}
    </TouchableOpacity>
  );
}
