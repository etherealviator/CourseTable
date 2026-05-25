// 课程详情 / 编辑页面

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from 'react-native-paper';
import { useCourses } from '../src/hooks/useCourses';
import { Course } from '../src/types';
import { WEEKDAY_NAMES, COURSE_COLORS } from '../src/constants/theme';
import { generateId } from '../src/utils/time';

export default function CourseDetailScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const isDark = useColorScheme() === 'dark';
  const { courses, addCourse, updateCourse, deleteCourse } = useCourses();

  const isEdit = !!courseId;
  const existing = isEdit ? courses.find((c: Course) => c.id === courseId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [teacher, setTeacher] = useState(existing?.teacher || '');
  const [location, setLocation] = useState(existing?.location || '');
  const [dayOfWeek, setDayOfWeek] = useState(existing?.dayOfWeek || 1);
  const [startPeriod, setStartPeriod] = useState(existing?.startPeriod || 1);
  const [endPeriod, setEndPeriod] = useState(existing?.endPeriod || 2);
  const [weeksStr, setWeeksStr] = useState(
    existing ? existing.weeks.join(',') : '1-18'
  );
  const [color, setColor] = useState<string>(existing?.color || COURSE_COLORS[0]);

  const colors = {
    bg: isDark ? '#000000' : '#F5F5F7',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1C1C1E',
    sub: isDark ? '#98989D' : '#8E8E93',
    border: isDark ? '#38383A' : '#E5E5EA',
    primary: '#4A90D9',
  };

  const parseWeeks = (str: string): number[] => {
    const weeks: number[] = [];
    const parts = str.split(/[,，、\s]+/);
    for (const part of parts) {
      if (part.includes('-') || part.includes('~')) {
        const [s, e] = part.split(/[-~]/).map(Number);
        if (s && e) {
          for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
            weeks.push(i);
          }
        }
      } else {
        const n = Number(part);
        if (n >= 1 && n <= 30) weeks.push(n);
      }
    }
    return [...new Set(weeks)].sort((a, b) => a - b);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入课程名称');
      return;
    }

    const weeks = parseWeeks(weeksStr);
    if (weeks.length === 0) {
      Alert.alert('提示', '请输入有效的周次，如 "1-18"');
      return;
    }

    const courseData = {
      name: name.trim(),
      teacher: teacher.trim(),
      location: location.trim(),
      dayOfWeek,
      startPeriod,
      endPeriod: Math.max(startPeriod, endPeriod),
      weeks,
    };

    if (isEdit && existing) {
      await updateCourse({ ...existing, ...courseData });
    } else {
      await addCourse(courseData);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('删除课程', `确定删除「${existing.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          await deleteCourse(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 课程名 */}
      <Text style={[styles.label, { color: colors.sub }]}>课程名称</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        value={name}
        onChangeText={setName}
        placeholder="例如：高等数学"
        placeholderTextColor={colors.sub}
      />

      {/* 教师 */}
      <Text style={[styles.label, { color: colors.sub }]}>任课教师</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        value={teacher}
        onChangeText={setTeacher}
        placeholder="例如：张老师"
        placeholderTextColor={colors.sub}
      />

      {/* 地点 */}
      <Text style={[styles.label, { color: colors.sub }]}>上课地点</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        value={location}
        onChangeText={setLocation}
        placeholder="例如：教1-201"
        placeholderTextColor={colors.sub}
      />

      {/* 星期 */}
      <Text style={[styles.label, { color: colors.sub }]}>星期</Text>
      <View style={styles.chipRow}>
        {WEEKDAY_NAMES.map((name: string, idx: number) => {
          const d = idx + 1;
          const selected = d === dayOfWeek;
          return (
            <TouchableOpacity
              key={d}
              style={[
                styles.chip,
                selected && { backgroundColor: colors.primary },
                !selected && { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setDayOfWeek(d)}
            >
              <Text style={[styles.chipText, { color: selected ? '#FFF' : colors.text }]}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 节次 */}
      <Text style={[styles.label, { color: colors.sub }]}>节次</Text>
      <View style={styles.periodRow}>
        <View style={styles.periodCol}>
          <Text style={[styles.periodLabel, { color: colors.sub }]}>开始节</Text>
          <View style={styles.chipRow}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(p => (
              <TouchableOpacity
                key={`s-${p}`}
                style={[
                  styles.chipSmall,
                  p === startPeriod && { backgroundColor: colors.primary },
                  p !== startPeriod && { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setStartPeriod(p)}
              >
                <Text style={[styles.chipTextSmall, { color: p === startPeriod ? '#FFF' : colors.text }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.periodCol}>
        <Text style={[styles.periodLabel, { color: colors.sub }]}>结束节</Text>
        <View style={styles.chipRow}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(p => (
            <TouchableOpacity
              key={`e-${p}`}
              style={[
                styles.chipSmall,
                p === endPeriod && { backgroundColor: colors.primary },
                p !== endPeriod && { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setEndPeriod(p)}
            >
              <Text style={[styles.chipTextSmall, { color: p === endPeriod ? '#FFF' : colors.text }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 周次 */}
      <Text style={[styles.label, { color: colors.sub }]}>上课周次</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        value={weeksStr}
        onChangeText={setWeeksStr}
        placeholder="例如：1-18 或 1,3,5,7"
        placeholderTextColor={colors.sub}
      />

      {/* 颜色 */}
      <Text style={[styles.label, { color: colors.sub }]}>课程颜色</Text>
      <View style={styles.colorRow}>
        {COURSE_COLORS.map((c: string) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              c === color && styles.colorDotSelected,
            ]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      {/* 按钮 */}
      <View style={styles.btnRow}>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveBtn}
          buttonColor={colors.primary}
          textColor="#FFF"
        >
          {isEdit ? '保存修改' : '添加课程'}
        </Button>
        {isEdit && (
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteBtn}
            textColor="#FF3B30"
          >
            删除
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  chipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 30,
    alignItems: 'center',
  },
  chipTextSmall: { fontSize: 12, fontWeight: '500' },
  periodRow: { gap: 12 },
  periodCol: { marginBottom: 8 },
  periodLabel: { fontSize: 12, marginBottom: 4 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: { borderColor: '#1C1C1E', borderWidth: 3 },
  btnRow: { marginTop: 30, gap: 10 },
  saveBtn: { borderRadius: 10 },
  deleteBtn: { borderRadius: 10, borderColor: '#FF3B30' },
});
