import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WEEKDAY_NAMES } from '../../../shared/utils/time';

interface Props {
  currentWeek: number;
  showWeekends: boolean;
  onPrev: () => void;
  onNext: () => void;
  themeColor?: string;
}

export function WeekHeader({ currentWeek, showWeekends, onPrev, onNext }: Props) {
  const days = showWeekends ? WEEKDAY_NAMES : WEEKDAY_NAMES.slice(0, 5);

  return (
    <View style={{ backgroundColor: '#F5F5F7', paddingBottom: 4 }}>
      {/* 周选择 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 }}>
        <TouchableOpacity onPress={onPrev} hitSlop={12}>
          <Text style={{ fontSize: 18, color: '#999' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#333', letterSpacing: 1 }}>
          第 {currentWeek} 周
        </Text>
        <TouchableOpacity onPress={onNext} hitSlop={12}>
          <Text style={{ fontSize: 18, color: '#999' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 星期行 */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
        <View style={{ width: 50 }} />
        {days.map((name, i) => {
          const isToday = i + 1 === new Date().getDay() || (i === 6 && new Date().getDay() === 0);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: isToday ? '700' : '500', color: isToday ? '#4A90D9' : '#999' }}>
                {name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
