// 顶部周次头部组件
// 显示：第X周 | 星期X | X月X日

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WEEKDAY_NAMES } from '../constants/theme';
import { formatDate } from '../utils/time';

interface WeekHeaderProps {
  currentWeek: number;
  totalWeeks: number;
  todayDay: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isDark: boolean;
}

export default function WeekHeader({
  currentWeek,
  totalWeeks,
  todayDay,
  onPrevWeek,
  onNextWeek,
  isDark,
}: WeekHeaderProps) {
  const colors = isDark
    ? { text: '#FFFFFF', secondary: '#98989D', bg: '#1C1C1E', accent: '#5DA0E8' }
    : { text: '#1C1C1E', secondary: '#8E8E93', bg: '#FFFFFF', accent: '#4A90D9' };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TouchableOpacity onPress={onPrevWeek} style={styles.arrowBtn}>
        <Text style={[styles.arrow, { color: colors.accent }]}>‹</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={[styles.weekText, { color: colors.text }]}>
          第 {currentWeek} 周
        </Text>
        <View style={styles.row}>
          <Text style={[styles.dayText, { color: colors.secondary }]}>
            {WEEKDAY_NAMES[todayDay - 1]}
          </Text>
          <Text style={[styles.dateText, { color: colors.secondary }]}>
            {'  '}{formatDate()}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={onNextWeek} style={styles.arrowBtn}>
        <Text style={[styles.arrow, { color: colors.accent }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: 8,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 28,
    fontWeight: '300',
  },
  center: {
    alignItems: 'center',
  },
  weekText: {
    fontSize: 20,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dayText: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
  },
});
