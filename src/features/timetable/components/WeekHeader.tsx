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

export function WeekHeader({ currentWeek, showWeekends, onPrev, onNext, themeColor }: Props) {
  const days = showWeekends ? WEEKDAY_NAMES : WEEKDAY_NAMES.slice(0, 5);
  const color = themeColor || '#4A90D9';

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
      {/* 周切换 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
        <TouchableOpacity onPress={onPrev} hitSlop={12} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#666' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#333' }}>第 {currentWeek} 周</Text>
        <TouchableOpacity onPress={onNext} hitSlop={12} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#666' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 星期标签 */}
      <View style={{ flexDirection: 'row' }}>
        {days.map((name, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#999', fontWeight: '500' }}>{name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
