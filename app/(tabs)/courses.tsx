import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { FAB } from 'react-native-paper';
import { useTimetable } from '../../src/features/timetable/store';
import { Course } from '../../src/shared/types';
import { WEEKDAY_NAMES } from '../../src/shared/utils/time';

export default function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const { courses, currentWeek, deleteCourse } = useTimetable();

  const colors = {
    bg: isDark ? '#000' : '#F5F5F7',
    surface: isDark ? '#1C1C1E' : '#FFF',
    text: isDark ? '#FFF' : '#1C1C1E',
    sub: isDark ? '#98989D' : '#8E8E93',
  };

  const handleDelete = (c: Course) => {
    Alert.alert('删除课程', `确定删除「${c.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteCourse(c.id) },
    ]);
  };

  const renderItem = ({ item }: { item: Course }) => {
    const isThisWeek = item.weeks.includes(currentWeek);
    const weekStr = item.weeks.length <= 5 ? item.weeks.join(', ') : `${item.weeks[0]}-${item.weeks[item.weeks.length - 1]}`;

    return (
      <TouchableOpacity
        style={{ backgroundColor: colors.surface, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: item.color, padding: 12, marginHorizontal: 16, marginVertical: 4 }}
        onPress={() => router.push({ pathname: '/course-detail', params: { id: item.id } })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: isThisWeek ? colors.text : colors.sub }} numberOfLines={1}>
              {item.name}
              {!isThisWeek && <Text style={{ fontSize: 10, color: '#FF9500' }}> 非本周</Text>}
            </Text>
            <Text style={{ fontSize: 13, color: colors.sub, marginTop: 2 }}>
              {WEEKDAY_NAMES[item.dayOfWeek - 1]} {item.startPeriod}-{item.endPeriod}节
              {item.location ? ` · ${item.location}` : ''}
              {item.teacher ? ` · ${item.teacher}` : ''}
            </Text>
            <Text style={{ fontSize: 11, color: colors.sub, marginTop: 2 }}>
              {item.weeks.length}周课程 · 第{weekStr}周
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
            <Text style={{ fontSize: 18, color: '#FF3B30' }}>🗑</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={courses}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>我的课程</Text>
            <Text style={{ fontSize: 14, color: colors.sub, marginTop: 4 }}>
              共 {courses.length} 门课 · 当前第 {currentWeek} 周
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
            <Text style={{ fontSize: 15, color: colors.sub, textAlign: 'center', lineHeight: 22 }}>
              还没有添加课程{'\n'}点击下方 + 按钮添加，或从教务系统导入
            </Text>
          </View>
        }
        contentContainerStyle={courses.length === 0 ? { flexGrow: 1 } : undefined}
      />
      <FAB
        icon="plus"
        style={{ position: 'absolute', right: 16, bottom: 16 + insets.bottom, backgroundColor: '#3B82F6', borderRadius: 28 }}
        color="#FFF"
        onPress={() => router.push('/course/add')}
      />
    </View>
  );
}
