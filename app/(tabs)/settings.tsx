import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 16 }}>设置</Text>
        <Text style={{ color: '#666' }}>学期起始、主题、教务导入</Text>
      </View>
    </SafeAreaView>
  );
}
