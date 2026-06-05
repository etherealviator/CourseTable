import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useTimetable } from '../../src/features/timetable/store';
import { parseCourseTable, parseGridData } from '../../src/features/import/parser';
import { searchSchools, loadSchools, SchoolEntry } from '../../src/features/import/schools';
import { generateId } from '../../src/shared/utils/time';
import { COURSE_COLORS } from '../../src/shared/constants/theme';

export default function ImportScreen() {
  const router = useRouter();
  const { importCourses } = useTimetable();
  const [url, setUrl] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [matchedSchools, setMatchedSchools] = useState<SchoolEntry[]>([]);
  const [htmlInput, setHtmlInput] = useState('');
  const [mode, setMode] = useState<'url' | 'paste'>('url');

  const handleSearch = async (q: string) => {
    setSchoolQuery(q);
    const schools = await loadSchools();
    setMatchedSchools(searchSchools(q, schools));
  };

  const handleImportFromHtml = (html: string) => {
    setLoading(true);
    const parsed = parseCourseTable(html);
    if (parsed.length === 0) {
      try {
        const data = JSON.parse(html);
        if (Array.isArray(data)) {
          const parsed2 = parseGridData(data);
          if (parsed2.length > 0) {
            importWithColors(parsed2);
            return;
          }
        }
      } catch {}
      alert('未识别到课程数据，请确认粘贴的是课程表HTML');
      setLoading(false);
      return;
    }
    importWithColors(parsed);
  };

  const importWithColors = (parsed: { name: string; teacher: string; location: string; dayOfWeek: number; periods: string; weeks: string }[]) => {
    const courses = parsed.map(p => {
      const [start, end] = (p.periods || '1-2').split('-').map(Number);
      const weeks = parseWeeks(p.weeks);
      return {
        id: generateId(),
        name: p.name,
        teacher: p.teacher,
        location: p.location,
        dayOfWeek: p.dayOfWeek || 1,
        startPeriod: start || 1,
        endPeriod: end || 2,
        weeks: weeks.length > 0 ? weeks : Array.from({ length: 18 }, (_, i) => i + 1),
        color: COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)],
      };
    });
    importCourses(courses);
    setLoading(false);
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      {!showWebView ? (
        <>
          <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
            <TouchableOpacity
              onPress={() => setMode('url')}
              style={{ flex: 1, backgroundColor: mode === 'url' ? '#3B82F6' : '#eee', borderRadius: 8, padding: 10, alignItems: 'center' }}
            >
              <Text style={{ color: mode === 'url' ? '#fff' : '#666', fontWeight: '600' }}>教务系统登录</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('paste')}
              style={{ flex: 1, backgroundColor: mode === 'paste' ? '#3B82F6' : '#eee', borderRadius: 8, padding: 10, alignItems: 'center' }}
            >
              <Text style={{ color: mode === 'paste' ? '#fff' : '#666', fontWeight: '600' }}>粘贴HTML</Text>
            </TouchableOpacity>
          </View>

          {mode === 'url' ? (
            <>
              <Text style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>搜索学校或直接输入教务系统地址</Text>
              <TextInput
                value={schoolQuery}
                onChangeText={handleSearch}
                placeholder="搜索学校名称..."
                style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 8 }}
              />
              {matchedSchools.slice(0, 10).map(s => (
                <TouchableOpacity
                  key={s.name}
                  onPress={() => { setUrl(s.urls[0]); setSchoolQuery(s.name); }}
                  style={{ padding: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' }}
                >
                  <Text style={{ fontSize: 14 }}>{s.name} <Text style={{ color: '#aaa', fontSize: 12 }}>{s.province}</Text></Text>
                  <Text style={{ fontSize: 11, color: '#3B82F6' }}>{s.urls[0]}</Text>
                </TouchableOpacity>
              ))}
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="或直接粘贴教务系统地址"
                style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, marginTop: 8, marginBottom: 12 }}
              />
              <TouchableOpacity
                onPress={() => url && setShowWebView(true)}
                style={{ backgroundColor: '#3B82F6', borderRadius: 8, padding: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>打开教务系统</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>粘贴课程表页面的 HTML 源码</Text>
              <TextInput
                value={htmlInput}
                onChangeText={setHtmlInput}
                multiline
                numberOfLines={10}
                placeholder="<table>...</table>"
                style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 13, minHeight: 150, textAlignVertical: 'top', marginBottom: 12 }}
              />
              <TouchableOpacity
                onPress={() => htmlInput && handleImportFromHtml(htmlInput)}
                style={{ backgroundColor: '#3B82F6', borderRadius: 8, padding: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>解析并导入</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      ) : (
        <View style={{ flex: 1, minHeight: 600 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => setShowWebView(false)}>
              <Text style={{ color: '#3B82F6', fontSize: 15 }}>← 返回</Text>
            </TouchableOpacity>
          </View>
          {loading && <ActivityIndicator style={{ marginBottom: 8 }} />}
          <WebView
            source={{ uri: url }}
            style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}
            javaScriptEnabled
            domStorageEnabled
            onNavigationStateChange={(nav) => {
              if (nav.title && /课程表|课表|schedule|timetable/i.test(nav.title)) {
                // 可能到了课表页面，尝试抓取
              }
            }}
            injectedJavaScript={`
              setTimeout(() => {
                const tables = document.querySelectorAll('table');
                if (tables.length > 0) {
                  const html = tables[0].outerHTML || document.body.innerHTML;
                  window.ReactNativeWebView.postMessage(html);
                }
              }, 3000);
              true;
            `}
            onMessage={(e) => {
              const html = e.nativeEvent.data;
              if (html && html.includes('<table')) {
                handleImportFromHtml(html);
              }
            }}
          />
        </View>
      )}
    </ScrollView>
  );
}

function parseWeeks(s: string): number[] {
  if (!s) return [];
  const single = s.match(/单周/);
  const weeks: number[] = [];
  const range = s.match(/(\d+)[-~](\d+)/);
  if (range) {
    for (let i = Number(range[1]); i <= Number(range[2]); i++) {
      if (single && i % 2 === 0) continue;
      if (!single && s.includes('双') && i % 2 === 1) continue;
      weeks.push(i);
    }
  }
  if (weeks.length === 0) {
    const n = parseInt(s);
    if (n > 0 && n <= 20) weeks.push(n);
  }
  return weeks.length > 0 ? weeks : Array.from({ length: 18 }, (_, i) => i + 1);
}
