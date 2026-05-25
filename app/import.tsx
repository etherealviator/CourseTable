// 教务系统导入页面
// WebView 登录教务系统 → 自动抓取课程表 → 智能解析裁剪

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Button, SegmentedButtons } from 'react-native-paper';
import { useCourses } from '../src/hooks/useCourses';
import { Course, ParsedCourse, EduSystemType } from '../src/types';
import { EDU_TEMPLATES, parseCourseTable } from '../src/utils/parser';
import { COURSE_COLORS } from '../src/constants/theme';
import { generateId } from '../src/utils/time';

export default function ImportScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { importCourses } = useCourses();

  const [mode, setMode] = useState<'webview' | 'paste'>('webview');
  const [url, setUrl] = useState('');
  const [htmlText, setHtmlText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [webViewVisible, setWebViewVisible] = useState(false);

  const webViewRef = useRef<WebView>(null);

  const colors = {
    bg: isDark ? '#000000' : '#F5F5F7',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1C1C1E',
    sub: isDark ? '#98989D' : '#8E8E93',
    border: isDark ? '#38383A' : '#E5E5EA',
    primary: '#4A90D9',
    green: '#34C759',
  };

  // 注入 JS 用于抓取页面 HTML
  const injectedJS = `
    (function() {
      // 等待页面加载完成
      setTimeout(function() {
        var html = document.documentElement.outerHTML;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'html',
          content: html,
          url: window.location.href,
          title: document.title
        }));
      }, 2000);
    })();
  `;

  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'html' && data.content) {
        setParsing(true);
        // 解析 HTML
        setTimeout(() => {
          const courses = parseCourseTable(data.content);
          setParsedCourses(courses);
          setSelectedCourses(new Set(courses.map((_c: ParsedCourse, i: number) => i)));
          setParsing(false);
          setWebViewVisible(false);
        }, 500);
      }
    } catch (e) {
      console.warn('Parse message error:', e);
    }
  }, []);

  const handlePasteParse = () => {
    if (!htmlText.trim()) {
      Alert.alert('提示', '请先粘贴课程表 HTML 代码');
      return;
    }

    setParsing(true);
    setTimeout(() => {
      const courses = parseCourseTable(htmlText);
      setParsedCourses(courses);
      setSelectedCourses(new Set(courses.map((_c: ParsedCourse, i: number) => i)));
      setParsing(false);
    }, 300);
  };

  const toggleCourse = (idx: number) => {
    const next = new Set(selectedCourses);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedCourses(next);
  };

  const handleImport = async () => {
    const selected = parsedCourses.filter((_c: ParsedCourse, i: number) => selectedCourses.has(i));
    if (selected.length === 0) {
      Alert.alert('提示', '请至少选择一门课程');
      return;
    }

    const newCourses: Course[] = selected.map((pc, i) => {
      // 解析节次
      let startPeriod = 1;
      let endPeriod = 2;
      if (pc.periods) {
        const parts = pc.periods.split(/[-~]/).map(Number);
        if (parts.length === 2) {
          startPeriod = Math.min(parts[0], parts[1]);
          endPeriod = Math.max(parts[0], parts[1]);
        }
      }

      // 解析周次
      const weeks: number[] = [];
      if (pc.weeks) {
        const weekParts = pc.weeks.split(/[-~]/);
        if (weekParts.length === 2) {
          const start = parseInt(weekParts[0]);
          const end = parseInt(weekParts[1]);
          if (start && end) {
            for (let w = Math.min(start, end); w <= Math.max(start, end); w++) {
              weeks.push(w);
            }
          }
        }
      }
      if (weeks.length === 0) {
        for (let w = 1; w <= 18; w++) weeks.push(w);
      }

      return {
        id: generateId(),
        name: pc.name,
        teacher: pc.teacher,
        location: pc.location,
        dayOfWeek: pc.dayOfWeek || 1,
        startPeriod,
        endPeriod,
        weeks,
        color: COURSE_COLORS[i % COURSE_COLORS.length],
      };
    });

    await importCourses(newCourses);
    Alert.alert('导入成功', `已导入 ${newCourses.length} 门课程`, [
      { text: '好的', onPress: () => router.back() },
    ]);
  };

  const handleCaptureHtml = () => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        var html = document.documentElement.outerHTML;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'html',
          content: html,
          url: window.location.href,
          title: document.title
        }));
      })();
      true;
    `);
    setParsing(true);
  };

  // WebView 模式
  if (webViewVisible) {
    const targetUrl = url || 'https://www.baidu.com';
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.webviewHeader}>
          <TouchableOpacity onPress={() => setWebViewVisible(false)}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>取消</Text>
          </TouchableOpacity>
          <Text style={[styles.webviewTitle, { color: colors.text }]} numberOfLines={1}>
            登录教务系统
          </Text>
          <TouchableOpacity onPress={handleCaptureHtml}>
            <Text style={[styles.captureBtn, { color: colors.green }]}>
              {parsing ? '解析中...' : '抓取课表'}
            </Text>
          </TouchableOpacity>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: targetUrl }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.sub }]}>加载中...</Text>
            </View>
          )}
        />
        {parsing && (
          <View style={styles.parsingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.parsingText}>正在解析课程表...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 导入方式选择 */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>导入方式</Text>
      <SegmentedButtons
        value={mode}
        onValueChange={(v) => setMode(v as 'webview' | 'paste')}
        buttons={[
          { value: 'webview', label: '教务系统登录' },
          { value: 'paste', label: '粘贴HTML' },
        ]}
        style={styles.segment}
      />

      {mode === 'webview' ? (
        <View>
          <Text style={[styles.label, { color: colors.sub }]}>教务系统地址</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={url}
            onChangeText={setUrl}
            placeholder="输入教务系统网址（或留空手动输入）"
            placeholderTextColor={colors.sub}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={[styles.hintText, { color: colors.sub }]}>
            登录教务系统后，导航到课程表页面，点击右上角「抓取课表」按钮
          </Text>
          <Button
            mode="contained"
            onPress={() => setWebViewVisible(true)}
            style={styles.actionBtn}
            buttonColor={colors.primary}
            textColor="#FFF"
          >
            打开教务系统
          </Button>
        </View>
      ) : (
        <View>
          <Text style={[styles.label, { color: colors.sub }]}>粘贴课程表 HTML</Text>
          <TextInput
            style={[styles.htmlInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={htmlText}
            onChangeText={setHtmlText}
            placeholder="在教务系统课程表页面右键→查看网页源代码→复制 HTML→粘贴到这里"
            placeholderTextColor={colors.sub}
            multiline
            textAlignVertical="top"
          />
          <Button
            mode="contained"
            onPress={handlePasteParse}
            style={styles.actionBtn}
            buttonColor={colors.primary}
            textColor="#FFF"
            loading={parsing}
          >
            解析课程表
          </Button>
        </View>
      )}

      {/* 解析结果 */}
      {parsing && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.sub }]}>正在解析...</Text>
        </View>
      )}

      {parsedCourses.length > 0 && (
        <View style={styles.resultSection}>
          <View style={styles.resultHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              解析结果 ({parsedCourses.length} 门)
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (selectedCourses.size === parsedCourses.length) {
                  setSelectedCourses(new Set());
                } else {
                  setSelectedCourses(new Set(parsedCourses.map((_c: ParsedCourse, i: number) => i)));
                }
              }}
            >
              <Text style={[styles.selectAll, { color: colors.primary }]}>
                {selectedCourses.size === parsedCourses.length ? '取消全选' : '全选'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.hintText, { color: colors.sub, marginBottom: 8 }]}>
            已自动裁剪只保留课程名、教师、地点。点击选择要导入的课程。
          </Text>

          {parsedCourses.map((course, idx) => {
            const selected = selectedCourses.has(idx);
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.resultItem,
                  { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border },
                ]}
                onPress={() => toggleCourse(idx)}
              >
                <View style={styles.checkbox}>
                  <View style={[
                    styles.checkboxInner,
                    selected && { backgroundColor: colors.primary },
                    { borderColor: selected ? colors.primary : colors.sub },
                  ]}>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultName, { color: colors.text }]}>{course.name}</Text>
                  <Text style={[styles.resultMeta, { color: colors.sub }]}>
                    {course.teacher ? `${course.teacher} · ` : ''}
                    {course.location || '未指定地点'}
                  </Text>
                  <Text style={[styles.resultMeta, { color: colors.sub }]}>
                    周{course.dayOfWeek || '?'}
                    {course.periods ? ` ${course.periods}节` : ''}
                    {course.weeks ? ` · 第${course.weeks}周` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <Button
            mode="contained"
            onPress={handleImport}
            style={styles.importBtn}
            buttonColor="#34C759"
            textColor="#FFF"
          >
            导入选中的 {selectedCourses.size} 门课程
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  segment: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  htmlInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 150,
    fontFamily: 'monospace',
  },
  hintText: { fontSize: 12, marginTop: 6, lineHeight: 18 },
  actionBtn: { marginTop: 14, borderRadius: 10 },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  loadingText: { fontSize: 14 },
  resultSection: { marginTop: 24 },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectAll: { fontSize: 14, fontWeight: '600' },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
  },
  checkbox: { marginRight: 12 },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600' },
  resultMeta: { fontSize: 12, marginTop: 2 },
  importBtn: { marginTop: 16, borderRadius: 10 },
  // WebView 样式
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
  },
  backBtn: { fontSize: 16 },
  webviewTitle: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  captureBtn: { fontSize: 16, fontWeight: '600' },
  webview: { flex: 1 },
  loading: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parsingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parsingText: { color: '#FFF', fontSize: 16, marginTop: 12 },
});
