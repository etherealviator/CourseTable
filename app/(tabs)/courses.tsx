// 课程列表管理页面

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { FAB, IconButton } from 'react-native-paper';
import { useCourses } from '../../src/hooks/useCourses';
import { Course } from '../../src/types';
import { WEEKDAY_NAMES } from '../../src/constants/theme';

export default function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const { courses, currentWeek, deleteCourse } = useCourses();

  const colors = {
    bg: isDark ? '#000000' : '#F5F5F7',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1C1C1E',
    sub: isDark ? '#98989D' : '#8E8E93',
    border: isDark ? '#38383A' : '#E5E5EA',
  };

  const handleDelete = useCallback((course: Course) => {
    Alert.alert(
      '删除课程',
      `确定删除「${course.name}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => deleteCourse(course.id) },
      ]
    );
  }, [deleteCourse]);

  const renderCourse = useCallback(({ item }: { item: Course }) => {
    const isThisWeek = item.weeks.includes(currentWeek);
    const weekStr = item.weeks.length <= 5
      ? item.weeks.join(', ')
      : `${item.weeks[0]}-${item.weeks[item.weeks.length - 1]}`;

    return (
      <TouchableOpacity
        style={[styles.courseItem, { backgroundColor: colors.surface, borderLeftColor: item.color }]}
        onPress={() => router.push({ pathname: '/course-detail', params: { courseId: item.id } })}
        activeOpacity={0.7}
      >
        <View style={styles.courseInfo}>
          <View style={styles.courseHeader}>
            <Text
              style={[styles.courseName, { color: isThisWeek ? colors.text : colors.sub }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {!isThisWeek && (
              <View style={styles.nonWeekTag}>
                <Text style={styles.nonWeekTagText}>非本周</Text>
              </View>
            )}
          </View>
          <Text style={[styles.courseMeta, { color: colors.sub }]}>
            {WEEKDAY_NAMES[item.dayOfWeek - 1]} {item.startPeriod}-{item.endPeriod}节
            {item.location ? ` · ${item.location}` : ''}
          </Text>
          {item.teacher ? (
            <Text style={[styles.courseMeta, { color: colors.sub }]}>
              {item.teacher}
            </Text>
          ) : null}
          <Text style={[styles.weekInfo, { color: colors.sub }]}>
            {item.weeks.length}周课程 · 第{weekStr}周
          </Text>
        </View>
        <IconButton
          icon="delete-outline"
          size={20}
          iconColor="#FF3B30"
          onPress={() => handleDelete(item)}
        />
      </TouchableOpacity>
    );
  }, [currentWeek, colors, router, handleDelete]);

  const ListHeader = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Text style={[styles.title, { color: colors.text }]}>我的课程</Text>
      <Text style={[styles.subtitle, { color: colors.sub }]}>
        共 {courses.length} 门课 · 当前第 {currentWeek} 周
      </Text>
    </View>
  );

  const ListEmpty = (
    <View style={styles.empty}>
      <Text style={[styles.emptyText, { color: colors.sub }]}>
        还没有添加课程{'\n'}点击下方 + 按钮添加，或从教务系统导入
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={courses}
        renderItem={renderCourse}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={courses.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => router.push('/course-detail')}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 10,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  courseInfo: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  nonWeekTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nonWeekTagText: {
    fontSize: 10,
    color: '#FF9500',
    fontWeight: '600',
  },
  courseMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  weekInfo: {
    fontSize: 11,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#4A90D9',
    borderRadius: 28,
  },
});
