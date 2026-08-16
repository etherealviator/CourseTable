import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WEEKDAY_NAMES } from '../../../shared/utils/time';

interface Props {
  currentWeek: number;
  totalWeeks: number;
  showWeekends: boolean;
  semesterStarted: boolean;
  startLabel: string;
  todayLabel: string;
  daysUntil: number;
  dayDates: number[];
  isDark: boolean;
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
  onMenu: () => void;
}

export function WeekHeader({
  currentWeek, totalWeeks, showWeekends, semesterStarted, startLabel, todayLabel, daysUntil, dayDates, isDark,
  onPrev, onNext, onAdd, onMenu,
}: Props) {
  const days = showWeekends ? WEEKDAY_NAMES : WEEKDAY_NAMES.slice(0, 5);
  const labelW = 48;
  const bg = isDark ? '#1C1C1E' : '#fff';
  const titleColor = isDark ? '#eee' : '#333';
  const subColor = isDark ? '#888' : '#999';
  const dayColor = isDark ? '#666' : '#bbb';

  return (
    <View style={{ backgroundColor: bg, paddingTop: 4, paddingBottom: 6 }}>
      {/* 顶部：周数 + 日期 + 右上角操作 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 }}>
        <TouchableOpacity onPress={onPrev} hitSlop={12} style={{ paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 16, color: '#ccc' }}>‹</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          {semesterStarted ? (
            <>
              <Text style={{ fontSize: 14, fontWeight: '600', color: titleColor, letterSpacing: 0.5 }}>
                第 {currentWeek} 周<Text style={{ fontSize: 11, color: '#aaa' }}> / {totalWeeks}</Text>
              </Text>
              <Text style={{ fontSize: 10, color: subColor, marginTop: 1 }}>{todayLabel}</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#E8590C', letterSpacing: 0.5 }}>学期尚未开始</Text>
              <Text style={{ fontSize: 10, color: subColor, marginTop: 1 }}>{startLabel}开学 · 还有 {daysUntil} 天</Text>
            </>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onMenu} hitSlop={12} style={{ paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 18, color: isDark ? '#aaa' : '#666', fontWeight: '700' }}>⋮</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAdd} hitSlop={12} style={{ paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 22, color: '#4A90D9', lineHeight: 24, fontWeight: '600' }}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 星期行：周一 + 号数 */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
        <View style={{ width: labelW }} />
        {days.map((name, i) => {
          const isToday = i + 1 === new Date().getDay() || (i === 6 && new Date().getDay() === 0);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, color: isToday ? '#4A90D9' : dayColor, fontWeight: isToday ? '700' : '400' }}>
                {name}
              </Text>
              {dayDates.length > 0 && (
                <Text style={{ fontSize: 10, color: isToday ? '#4A90D9' : (isDark ? '#555' : '#ccc'), fontWeight: isToday ? '700' : '400', marginTop: 1 }}>
                  {dayDates[i] ?? ''}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
