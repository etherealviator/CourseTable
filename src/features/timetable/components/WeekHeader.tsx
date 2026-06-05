import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WEEKDAY_NAMES } from '../../../shared/utils/time';

interface Props {
  currentWeek: number;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekHeader({ currentWeek, onPrev, onNext }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 4, paddingBottom: 8, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={onPrev} hitSlop={8}>
          <Text style={{ fontSize: 20, color: '#666' }}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>第 {currentWeek} 周</Text>
        <TouchableOpacity onPress={onNext} hitSlop={8}>
          <Text style={{ fontSize: 20, color: '#666' }}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAY_NAMES.map((name, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#888' }}>{name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
