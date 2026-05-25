// 设置页面

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Switch, Divider, Button } from 'react-native-paper';
import { loadSettings, saveSettings, AppSettings, replaceAllCourses } from '../../src/utils/storage';
import { getDefaultSemesterStart, getCurrentWeek } from '../../src/utils/time';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const colors = {
    bg: isDark ? '#000000' : '#F5F5F7',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1C1C1E',
    sub: isDark ? '#98989D' : '#8E8E93',
    border: isDark ? '#38383A' : '#E5E5EA',
    primary: '#4A90D9',
  };

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const updateSetting = async (key: keyof AppSettings, value: unknown) => {
    const updated = await saveSettings({ [key]: value });
    setSettings(updated);
  };

  const handleClearData = () => {
    Alert.alert(
      '清除所有数据',
      '这将删除所有课程和设置，此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认清除',
          style: 'destructive',
          onPress: async () => {
            await replaceAllCourses([]);
            Alert.alert('已清除', '所有数据已清除');
          },
        },
      ]
    );
  };

  if (!settings) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8 }}>
        <Text style={[styles.pageTitle, { color: colors.text, paddingHorizontal: 20 }]}>
          设置
        </Text>

        {/* 外观 */}
        <Text style={[styles.sectionTitle, { color: colors.sub }]}>外观</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { color: colors.text }]}>深色模式</Text>
              <Text style={[styles.hint, { color: colors.sub }]}>
                {settings.darkMode === 'auto' ? '跟随系统' : settings.darkMode === 'dark' ? '始终深色' : '始终浅色'}
              </Text>
            </View>
            <Switch
              value={settings.darkMode === 'dark' || (settings.darkMode === 'auto' && isDark)}
              onValueChange={(v) => updateSetting('darkMode', v ? 'dark' : 'light')}
              color={colors.primary}
            />
          </View>
        </View>

        {/* 学期设置 */}
        <Text style={[styles.sectionTitle, { color: colors.sub }]}>学期</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              Alert.prompt
                ? Alert.prompt(
                    '学期开始日期',
                    '输入日期 (YYYY-MM-DD)',
                    async (text) => {
                      if (text && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
                        await updateSetting('semesterStart', text);
                        await updateSetting('currentWeek', 0);
                      }
                    },
                    'plain-text',
                    settings.semesterStart || getDefaultSemesterStart()
                  )
                : Alert.alert('提示', '请在下方输入学期开始日期');
            }}
          >
            <View>
              <Text style={[styles.label, { color: colors.text }]}>学期开始日期</Text>
              <Text style={[styles.hint, { color: colors.sub }]}>
                {settings.semesterStart || getDefaultSemesterStart()}
              </Text>
            </View>
            <Text style={[styles.arrow, { color: colors.sub }]}>›</Text>
          </TouchableOpacity>

          <Divider style={{ backgroundColor: colors.border }} />

          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              const weeks = [16, 17, 18, 19, 20];
              Alert.alert('总周数', '选择学期总周数', weeks.map(w => ({
                text: `${w} 周`,
                onPress: () => { updateSetting('totalWeeks', w); },
              })).concat([{ text: '取消', onPress: () => {} }]));
            }}
          >
            <View>
              <Text style={[styles.label, { color: colors.text }]}>学期总周数</Text>
              <Text style={[styles.hint, { color: colors.sub }]}>{settings.totalWeeks} 周</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.sub }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 导入 */}
        <Text style={[styles.sectionTitle, { color: colors.sub }]}>数据</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/import')}
          >
            <View>
              <Text style={[styles.label, { color: colors.text }]}>从教务系统导入</Text>
              <Text style={[styles.hint, { color: colors.sub }]}>登录教务系统自动解析课程表</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.sub }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 危险操作 */}
        <Text style={[styles.sectionTitle, { color: colors.sub }]}>其他</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.row} onPress={handleClearData}>
            <Text style={[styles.label, { color: '#FF3B30' }]}>清除所有数据</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: colors.sub }]}>
          课程表 v1.0.0 · 纯净无广告
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: {
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
    fontWeight: '300',
  },
  version: {
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 30,
    fontSize: 13,
  },
});
