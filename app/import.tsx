import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useTimetable } from '../src/features/timetable/store';
import { parseCourseTable, parseGridData } from '../src/features/import/parser';
import { searchSchools, loadSchools, SchoolEntry } from '../src/features/import/schools';
import { generateId } from '../src/shared/utils/time';
import { COURSE_COLORS } from '../src/shared/constants/theme';

export default function ImportScreen() {
  const router = useRouter();
  const { importCourses } = useTimetable();
  const webRef = useRef<WebView>(null);
  const [url, setUrl] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [matchedSchools, setMatchedSchools] = useState<SchoolEntry[]>([]);
  const [htmlInput, setHtmlInput] = useState('');
  const [mode, setMode] = useState<'url' | 'paste'>('url');
  const [parseResult, setParseResult] = useState<{ total: number; names: string[] } | null>(null);

  const handleSearch = async (q: string) => {
    setSchoolQuery(q);
    const schools = await loadSchools();
    setMatchedSchools(searchSchools(q, schools));
  };

  const parseHtml = (html: string): { name: string; teacher: string; location: string; dayOfWeek: number; periods: string; weeks: string }[] => {
    let parsed = parseCourseTable(html);
    if (parsed.length === 0) {
      try {
        const data = JSON.parse(html);
        if (Array.isArray(data)) {
          parsed = parseGridData(data);
        }
      } catch {}
    }
    return parsed;
  };

  const handleImportFromHtml = (html: string) => {
    setLoading(true);
    const parsed = parseHtml(html);
    if (parsed.length === 0) {
      Alert.alert(
        '未识别到课程',
        '解析器没有找到课程数据。你可以：\n1. 确认页面已完整加载后重试\n2. 检查是否已登录教务系统\n3. 试试粘贴 HTML 方式',
        [{ text: '好的', style: 'default' }]
      );
      setLoading(false);
      return;
    }
    // 显示预览
    setParseResult({
      total: parsed.length,
      names: parsed.slice(0, 10).map(p => p.name),
    });
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

  const handleManualFetch = () => {
    // 重新注入 JS 抓取
    webRef.current?.injectJavaScript(`
      (function(){
        var allHtml = '';
        var tables = document.querySelectorAll('table');
        for (var i = 0; i < tables.length; i++) {
          allHtml += tables[i].outerHTML + '\\n<hr>\\n';
        }
        window.ReactNativeWebView.postMessage(allHtml || document.body.innerHTML);
      })();
      true;
    `);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F5F7' }} contentContainerStyle={{ padding: 16 }}>
      {/* 模式切换 */}
      <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
        <TouchableOpacity
          onPress={() => setMode('url')}
          style={{ flex: 1, backgroundColor: mode === 'url' ? '#4A90D9' : '#eee', borderRadius: 8, padding: 10, alignItems: 'center' }}
        >
          <Text style={{ color: mode === 'url' ? '#fff' : '#666', fontWeight: '600' }}>教务系统</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('paste')}
          style={{ flex: 1, backgroundColor: mode === 'paste' ? '#4A90D9' : '#eee', borderRadius: 8, padding: 10, alignItems: 'center' }}
        >
          <Text style={{ color: mode === 'paste' ? '#fff' : '#666', fontWeight: '600' }}>粘贴 HTML</Text>
        </TouchableOpacity>
      </View>

      {!showWebView ? (
        <>
          {mode === 'url' ? (
            <>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>搜索学校或直接输入教务系统地址</Text>
                <TextInput
                  value={schoolQuery}
                  onChangeText={handleSearch}
                  placeholder="搜索学校名称..."
                  style={{ backgroundColor: '#F5F5F7', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 8 }}
                />
                {matchedSchools.slice(0, 8).map(s => (
                  <TouchableOpacity
                    key={s.name}
                    onPress={() => { setUrl(s.urls[0]); setSchoolQuery(s.name); }}
                    style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' }}
                  >
                    <Text style={{ fontSize: 14 }}>{s.name} <Text style={{ color: '#aaa', fontSize: 12 }}>{s.province}</Text></Text>
                    <Text style={{ fontSize: 11, color: '#4A90D9' }} numberOfLines={1}>{s.urls[0]}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  value={url}
                  onChangeText={setUrl}
                  placeholder="或直接粘贴教务系统地址"
                  style={{ backgroundColor: '#F5F5F7', borderRadius: 8, padding: 10, fontSize: 15, marginTop: 8, marginBottom: 8 }}
                />
                <TouchableOpacity
                  onPress={() => url && setShowWebView(true)}
                  style={{ backgroundColor: '#4A90D9', borderRadius: 8, padding: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>打开教务系统</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>在浏览器打开课表页面 → 查看网页源代码 → Ctrl+A 全选复制 → 粘贴到此处</Text>
              <TextInput
                value={htmlInput}
                onChangeText={setHtmlInput}
                multiline
                numberOfLines={10}
                placeholder="<table>...</table>"
                style={{ backgroundColor: '#F5F5F7', borderRadius: 8, padding: 10, fontSize: 13, minHeight: 150, textAlignVertical: 'top', marginBottom: 8 }}
              />
              <TouchableOpacity
                onPress={() => htmlInput && handleImportFromHtml(htmlInput)}
                style={{ backgroundColor: '#4A90D9', borderRadius: 8, padding: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>解析并导入</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View style={{ flex: 1, minHeight: 600 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => setShowWebView(false)}>
              <Text style={{ color: '#4A90D9', fontSize: 15 }}>← 返回</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#999' }}>登录后进入课表页面，点下方按钮抓取</Text>
          </View>
          {loading && <ActivityIndicator style={{ marginBottom: 8 }} color="#4A90D9" />}
          <WebView
            ref={webRef}
            source={{ uri: url }}
            style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
            javaScriptEnabled
            domStorageEnabled
            injectedJavaScript={`
              setTimeout(function(){
                window.__COURSETABLE_READY__ = true;
              }, 5000);
              true;
            `}
            onMessage={(e) => {
              const data = e.nativeEvent.data;
              if (data.startsWith('__JQGRID__')) {
                try {
                  const gridData = JSON.parse(data.slice(9));
                  const parsed = parseGridData(gridData);
                  if (parsed.length > 0) { importWithColors(parsed); return; }
                } catch(e) {}
              }
              if (data && (data.includes('<table') || data.includes('<tr') || data.includes('tbody'))) {
                handleImportFromHtml(data);
              } else {
                Alert.alert('未识别到表格', '抓取的内容中没有找到课程表格式的数据。请确认：\n1. 已登录教务系统\n2. 当前页面是课表页面\n3. 点击下方按钮重新抓取');
                setLoading(false);
              }
            }}
          />
          {/* 手动抓取按钮 */}
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              handleManualFetch();
            }}
            style={{ backgroundColor: '#4A90D9', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>抓取课程数据</Text>
          </TouchableOpacity>
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
