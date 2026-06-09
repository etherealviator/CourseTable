import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WEEKDAY_NAMES } from '../../../shared/utils/time';

interface Props {
  currentWeek: number;
  showWeekends: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekHeader({ currentWeek, showWeekends, onPrev, onNext }: Props) {
  const days = showWeekends ? WEEKDAY_NAMES : WEEKDAY_NAMES.slice(0, 5);
  const labelW = 36;

  return (
    <View style={{ backgroundColor: '#fff', paddingTop: 4, paddingBottom: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 6 }}>
        <TouchableOpacity onPress={onPrev} hitSlop={12}>
          <Text style={{ fontSize: 16, color: '#ccc' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#666', letterSpacing: 1 }}>
          第 {currentWeek} 周
        </Text>
        <TouchableOpacity onPress={onNext} hitSlop={12}>
          <Text style={{ fontSize: 16, color: '#ccc' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 星期行 */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
        <View style={{ width: labelW }} />
        {days.map((name, i) => {
          const isToday = i + 1 === new Date().getDay() || (i === 6 && new Date().getDay() === 0);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, color: isToday ? '#4A90D9' : '#bbb', fontWeight: isToday ? '700' : '400' }}>
                {name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
