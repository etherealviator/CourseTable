import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WEEKDAY_NAMES } from '../../../shared/utils/time';
import { ThemePreset } from '../../../shared/constants/theme';

interface Props {
  currentWeek: number;
  totalWeeks: number;
  showWeekends: boolean;
  semesterStarted: boolean;
  startLabel: string;
  todayLabel: string;
  daysUntil: number;
  dayDates: number[];
  theme: ThemePreset;
  onPrev: () => void;
  onNext: () => void;
  onGear: () => void;
}

export function WeekHeader({
  currentWeek, totalWeeks, showWeekends, semesterStarted, startLabel, todayLabel, daysUntil, dayDates, theme,
  onPrev, onNext, onGear,
}: Props) {
  const days = showWeekends ? WEEKDAY_NAMES : WEEKDAY_NAMES.slice(0, 5);
  const labelW = 48;
  const headerTextColor = theme.headerText;
  const subColor = theme.sub;
  const dayColor = theme.sub;

  return (
    <View style={{ backgroundColor: theme.headerBg, paddingTop: 4, paddingBottom: 6 }}>
      {/* 顶部：左上角学期/日期 · 中间周切换 · 右上角操作 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 }}>
        {/* 左上角：学期状态 + 日期 */}
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          {semesterStarted ? (
            <>
              <Text style={{ fontSize: 15, fontWeight: '700', color: headerTextColor, letterSpacing: 0.5 }}>{todayLabel}</Text>
              <Text style={{ fontSize: 10, color: subColor, marginTop: 1 }}>第 {currentWeek} 周 / {totalWeeks}</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.mode === 'light' ? '#E8590C' : '#FFB84D', letterSpacing: 0.5 }}>学期尚未开始</Text>
              <Text style={{ fontSize: 10, color: subColor, marginTop: 1 }}>{startLabel}开学 · 还有 {daysUntil} 天</Text>
            </>
          )}
        </View>

        {/* 中间：周切换（‹ 第X周 ›） */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onPrev} hitSlop={12} style={{ paddingHorizontal: 10 }}>
            <Text style={{ fontSize: 18, color: subColor }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 15, fontWeight: '700', color: headerTextColor, minWidth: 56, textAlign: 'center' }}>
            第 {currentWeek} 周
          </Text>
          <TouchableOpacity onPress={onNext} hitSlop={12} style={{ paddingHorizontal: 10 }}>
            <Text style={{ fontSize: 18, color: subColor }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 右上角 */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={onGear} hitSlop={12} style={{ paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 20, color: headerTextColor }}>⚙️</Text>
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
              <Text style={{ fontSize: 11, color: isToday ? theme.accent : dayColor, fontWeight: isToday ? '700' : '400' }}>
                {name}
              </Text>
              {dayDates.length > 0 && (
                <Text style={{ fontSize: 10, color: isToday ? theme.accent : dayColor, fontWeight: isToday ? '700' : '400', marginTop: 1 }}>
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
