import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTimetable } from '../../src/features/timetable/store';

export default function AddCourseScreen() {
  const router = useRouter();
  const { addCourse } = useTimetable();
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [location, setLocation] = useState('');
  const [day, setDay] = useState('1');
  const [startP, setStartP] = useState('1');
  const [endP, setEndP] = useState('2');
  const [weeks, setWeeks] = useState('1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18');

  const handleAdd = () => {
    const w = weeks.split(',').map(Number).filter(n => n > 0 && n <= 20);
    if (!name || w.length === 0) return;
    addCourse({
      name,
      teacher,
      location,
      dayOfWeek: Math.max(1, Math.min(7, Number(day) || 1)),
      startPeriod: Math.max(1, Math.min(12, Number(startP) || 1)),
      endPeriod: Math.max(1, Math.min(12, Number(endP) || 1)),
      weeks: w,
    });
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      {[
        ['课程名', name, setName, 'default'],
        ['教师', teacher, setTeacher, 'default'],
        ['地点', location, setLocation, 'default'],
        ['星期几 (1-7)', day, setDay, 'numeric'],
        ['开始节次 (1-12)', startP, setStartP, 'numeric'],
        ['结束节次 (1-12)', endP, setEndP, 'numeric'],
        ['周次 (逗号分隔)', weeks, setWeeks, 'default'],
      ].map((([label, value, setter, kt]: [string, string, (v: string) => void, string]) => (
        <View key={label as string} style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{label}</Text>
          <TextInput
            value={value as string}
            onChangeText={setter as (v: string) => void}
            keyboardType={(kt === 'numeric') ? 'numeric' : 'default'}
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#fafafa' }}
          />
        </View>
      ))}

      <TouchableOpacity onPress={handleAdd} style={{ backgroundColor: '#3B82F6', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>添加课程</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
