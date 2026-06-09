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

  const handleSearch = async (q: string) => {
    setSchoolQuery(q);
    const schools = await loadSchools();
    setMatchedSchools(searchSchools(q, schools));
  };

  // 核心解析函数
  const parseHtml = (html: string) => {
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
        '解析器没找到课程数据，可能原因：\n' +
        '1. 还没登录教务系统\n' +
        '2. 当前页面不是课表页面\n' +
        '3. 课表还没完全加载\n\n' +
        '请确认后，点击下方「重新抓取」再试。',
        [{ text: '好的', style: 'default' }]
      );
      setLoading(false);
      return;
    }

    const nameList = parsed.slice(0, 12).map((p, i) => `${i+1}. ${p.name}`).join('\n');
    Alert.alert(
      `识别到 ${parsed.length} 门课程`,
      nameList + '\n\n确认导入？',
      [
        { text: '取消', style: 'cancel', onPress: () => setLoading(false) },
        {
          text: '导入',
          onPress: () => {
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
          },
        },
      ]
    );
  };

  // 注入的 JS — 专门找课表表格
  const injectScript = `
    (function(){
      // 尝试1: jqGrid btable (正方教务系统常用)
      var grids = document.querySelectorAll('.ui-jqgrid-btable');
      for (var g = 0; g < grids.length; g++) {
        var rows = grids[g].querySelectorAll('tbody tr');
        if (rows.length > 5) {
          var data = [];
          for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll('td');
            if (cells.length > 0) {
              var row = {};
              for (var c = 0; c < cells.length; c++) {
                row['col' + c] = cells[c].textContent.trim();
              }
              data.push(row);
            }
          }
          if (data.length > 0) {
            window.ReactNativeWebView.postMessage('__JQGRID__' + JSON.stringify(data));
            return;
          }
        }
      }

      // 尝试2: 找有课程相关表头的表格
      var tables = document.querySelectorAll('table');
      var bestHtml = '';
      var bestScore = 0;

      for (var t = 0; t < tables.length; t++) {
        var html = tables[t].outerHTML;
        var text = tables[t].textContent || '';

        // 评分：越接近课表分数越高
        var score = 0;
        if (/课程名|课程名称|课名|kcmc|kcm/i.test(text)) score += 10;
        if (/教师|老师|任课|jsxm|授课教师/i.test(text)) score += 8;
        if (/教室|地点|上课地点|jsmc|cdmc/i.test(text)) score += 8;
        if (/星期|周[一二三四五六日天]|xqj|星期几/i.test(text)) score += 6;
        if (/节次|第\\d+节|上课时间|jcor|skjc/i.test(text)) score += 6;
        if (/周次|上课周|zcd|zc|周数/i.test(text)) score += 6;
        if (/\\d+[-~]\\d+节/.test(text)) score += 4;
        if (/\\d+[-~]\\d+周/.test(text)) score += 4;

        // 行数多加分（课表至少6行）
        var rowCount = (html.match(/<tr/gi) || []).length;
        if (rowCount >= 6) score += 5;
        if (rowCount >= 8) score += 3;
        // 列数
        var colCount = (html.match(/<t[dh]/gi) || []).length;
        var avgCols = rowCount > 0 ? colCount / rowCount : 0;
        if (avgCols >= 4) score += 3;
        if (avgCols >= 6) score += 2;

        // 排除明显不是课表的
        if (/登录|注册|密码|验证码|header|footer|menu|导航|版权|友情链接/i.test(text)) score -= 20;

        if (score > bestScore) {
          bestScore = score;
          bestHtml = html;
        }
      }

      if (bestScore > 10) {
        window.ReactNativeWebView.postMessage(bestHtml);
      } else {
        // 没找到课表，发全部表格
        var allHtml = '';
        for (var t = 0; t < tables.length; t++) {
          allHtml += tables[t].outerHTML + '\\n---SEP---\\n';
        }
        window.ReactNativeWebView.postMessage(allHtml || document.body.innerHTML);
      }
    })();
    true;
  `;

  const triggerFetch = () => {
    setLoading(true);
    webRef.current?.injectJavaScript(injectScript);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F5F7' }} contentContainerStyle={{ padding: 16 }}>
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
          ) : (
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                1. 浏览器打开教务系统 → 进入课表页面{'\n'}
                2. Ctrl+A 全选 → Ctrl+C 复制{'\n'}
                3. 粘贴到下方文本框
              </Text>
              <TextInput
                value={htmlInput}
                onChangeText={setHtmlInput}
                multiline
                numberOfLines={8}
                placeholder="粘贴课表页面的HTML代码..."
                style={{ backgroundColor: '#F5F5F7', borderRadius: 8, padding: 10, fontSize: 12, minHeight: 140, textAlignVertical: 'top', marginBottom: 8 }}
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
            {loading && <ActivityIndicator size="small" color="#4A90D9" />}
          </View>

          <WebView
            ref={webRef}
            source={{ uri: url }}
            style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
            javaScriptEnabled
            domStorageEnabled
            onMessage={(e) => {
              const data = e.nativeEvent.data;
              if (data.startsWith('__JQGRID__')) {
                try {
                  const gridData = JSON.parse(data.slice(9));
                  const parsed = parseGridData(gridData);
                  if (parsed.length > 0) { handleImportFromHtml(data.slice(9)); return; }
                } catch(e) {}
              }
              handleImportFromHtml(data);
            }}
            onLoadEnd={() => {}}
          />

          <View style={{ paddingVertical: 8, gap: 8 }}>
            <TouchableOpacity
              onPress={triggerFetch}
              style={{ backgroundColor: '#4A90D9', borderRadius: 8, padding: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>🔄 抓取课程数据</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>
              登录后进入课表页面，点上方按钮抓取。没识别到就多等几秒再试。
            </Text>
          </View>
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
