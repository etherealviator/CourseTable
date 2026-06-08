import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTimetable } from '../src/features/timetable/store';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { courses, updateCourse, deleteCourse } = useTimetable();
  const course = courses.find(c => c.id === id);

  if (!course) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#999' }}>课程不存在</Text>
      </View>
    );
  }

  const [name, setName] = useState(course.name);
  const [teacher, setTeacher] = useState(course.teacher);
  const [location, setLocation] = useState(course.location);
  const [dayOfWeek, setDayOfWeek] = useState(String(course.dayOfWeek));
  const [startPeriod, setStartPeriod] = useState(String(course.startPeriod));
  const [endPeriod, setEndPeriod] = useState(String(course.endPeriod));
  const [weeksStr, setWeeksStr] = useState(course.weeks.join(','));
  const [remark, setRemark] = useState(course.remark || '');

  const handleSave = () => {
    const weeks = weeksStr.split(',').map(Number).filter(n => n > 0 && n <= 20);
    if (!name || weeks.length === 0) return;
    updateCourse({
      ...course,
      name,
      teacher,
      location,
      dayOfWeek: Math.max(1, Math.min(7, Number(dayOfWeek) || 1)),
      startPeriod: Math.max(1, Math.min(12, Number(startPeriod) || 1)),
      endPeriod: Math.max(1, Math.min(12, Number(endPeriod) || 1)),
      weeks,
      remark,
    });
    router.back();
  };

  const handleDelete = () => {
    deleteCourse(course.id);
    router.back();
  };

  const fields: [string, string, string, (v: string) => void][] = [
    ['课程名', name, 'default', setName],
    ['教师', teacher, 'default', setTeacher],
    ['地点', location, 'default', setLocation],
    ['星期 (1-7)', dayOfWeek, 'numeric', setDayOfWeek],
    ['开始节次', startPeriod, 'numeric', setStartPeriod],
    ['结束节次', endPeriod, 'numeric', setEndPeriod],
    ['周次 (逗号分隔)', weeksStr, 'default', setWeeksStr],
    ['备注', remark, 'default', setRemark],
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      {fields.map(([label, value, kt, setter]: [string, string, string, (v: string) => void]) => (
        <View key={label} style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{label}</Text>
          <TextInput
            value={value}
            onChangeText={setter}
            keyboardType={kt === 'numeric' ? 'numeric' : 'default'}
            style={{
              borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
              padding: 10, fontSize: 15, backgroundColor: '#fafafa',
            }}
          />
        </View>
      ))}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <TouchableOpacity
          onPress={handleSave}
          style={{ flex: 1, backgroundColor: '#3B82F6', borderRadius: 8, padding: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>保存</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={{ flex: 1, backgroundColor: '#EF4444', borderRadius: 8, padding: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>删除</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
