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
  const [parseResult, setParseResult] = useState<{ total: number; names: string[] } | null>(null);

  const handleSearch = async (q: string) => {
    setSchoolQuery(q);
    const schools = await loadSchools();
    setMatchedSchools(searchSchools(q, schools));
  };

  // ── 核心解析 ──
  const doParse = (html: string) => {
    // 1. 尝试 JSON 数组 (jqGrid)
    try {
      const data = JSON.parse(html);
      if (Array.isArray(data) && data.length > 0) {
        const r = parseGridData(data);
        if (r.length > 0) return r;
      }
    } catch {}

    // 2. 尝试 HTML table 解析
    const r = parseCourseTable(html);
    if (r.length > 0) return r;

    return [];
  };

  // ── 导入确认 ──
  const confirmImport = (parsed: ReturnType<typeof doParse>) => {
    if (parsed.length === 0) {
      Alert.alert(
        '未识别到课程',
        '没能在页面中找到课程表数据。\n\n请确认：\n' +
        '1. 已登录教务系统\n' +
        '2. 当前页面是课表页面（不是首页/菜单页）\n' +
        '3. 课表已完全加载显示\n\n' +
        '试试在电脑浏览器打开课表 → Ctrl+A → Ctrl+C → 用「粘贴HTML」模式导入',
        [{ text: '好的', style: 'default' }]
      );
      setLoading(false);
      return;
    }

    const sample = parsed.slice(0, 15).map((p, i) =>
      `  ${i+1}. ${p.name}${p.teacher ? ' ('+p.teacher+')' : ''}`
    ).join('\n');

    setParseResult({ total: parsed.length, names: parsed.slice(0, 15).map(p => p.name) });

    Alert.alert(
      `找到 ${parsed.length} 门课程`,
      sample + '\n\n确认导入这些课程？',
      [
        { text: '取消', style: 'cancel', onPress: () => setLoading(false) },
        {
          text: '✅ 导入',
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

  // ── WebView 注入脚本 ──
  // 核心逻辑: 在浏览器端找到课表表格, 只发送课表数据回 RN
  const FETCH_SCRIPT = `
(function() {
  var results = [];

  // === 检测1: jqGrid 表格 (正方系统) ===
  var grids = document.querySelectorAll('.ui-jqgrid-btable');
  for (var g = 0; g < grids.length; g++) {
    var rows = grids[g].querySelectorAll('tbody tr');
    if (rows.length > 3) {
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

  // === 检测2: 评分制选择课表表格 ===
  var allTables = document.querySelectorAll('table');

  function scoreTable(table) {
    var text = table.textContent || '';
    var html = table.outerHTML || '';
    var rows = table.querySelectorAll('tr').length;
    var score = 0;

    // 正向评分 — 课程相关关键词
    if (/课程名|课名|kcmc|课程名称/i.test(text)) score += 15;
    if (/教师|老师|任课教师|授课教师|jsxm/i.test(text)) score += 12;
    if (/教室|上课地点|上课教室|jsmc|cdmc/i.test(text)) score += 12;
    if (/星期|周[一二三四五六日天]|xqj/i.test(text)) score += 10;
    if (/节次|第\\d+节|上课节次|jcor|skjc/i.test(text)) score += 10;
    if (/周次|上课周|zcd|zc/i.test(text)) score += 8;

    // 课表通常 7 列左右
    var firstRow = table.querySelector('tr');
    var cols = firstRow ? firstRow.querySelectorAll('td, th').length : 0;
    if (cols >= 5 && cols <= 9) score += 8;

    // 行数多加分
    if (rows >= 8) score += 6;
    if (rows >= 12) score += 4;
    if (rows >= 16) score += 2;

    // 包含时间格式加分 (08:00, 09:40 等)
    if (/\\d{2}:\\d{2}/.test(text)) score += 5;

    // 包含数字范围加分 (1-2节, 1-16周)
    if (/\\d+[-~]\\d+节/.test(text)) score += 5;
    if (/\\d+[-~]\\d+周/.test(text)) score += 5;

    // 负向评分 — 明显不是课表
    if (/登录|注册|密码|验证码|验证|header|footer|菜单|导航|nav|版权|友情链接|公告/i.test(text)) score -= 30;
    if (/校长|书记|校训|校徽/i.test(text)) score -= 20;
    if (/新闻|通知|公示/i.test(text)) score -= 15;
    if (rows < 4) score -= 20;

    // 列数太少肯定是别的表
    if (cols < 3) score -= 20;

    return score;
  }

  var bestTable = null;
  var bestScore = 0;

  for (var t = 0; t < allTables.length; t++) {
    var sc = scoreTable(allTables[t]);
    if (sc > bestScore) {
      bestScore = sc;
      bestTable = allTables[t];
    }
  }

  if (bestTable && bestScore >= 15) {
    window.ReactNativeWebView.postMessage(bestTable.outerHTML);
  } else {
    // 实在找不到, 把所有表格发回去让 RN端再试
    var allHtml = '';
    for (var t = 0; t < allTables.length; t++) {
      allHtml += allTables[t].outerHTML + '\\n---SEP---\\n';
    }
    window.ReactNativeWebView.postMessage(allHtml || document.body.innerHTML);
  }
})();
true;
`;

  const triggerFetch = () => {
    setLoading(true);
    setParseResult(null);
    webRef.current?.injectJavaScript(FETCH_SCRIPT);
  };

  const handleWebViewMessage = (raw: string) => {
    setLoading(false);

    if (raw.startsWith('__JQGRID__')) {
      const json = raw.slice(9);
      try {
        const data = JSON.parse(json);
        const parsed = parseGridData(data);
        if (parsed.length > 0) { confirmImport(parsed); return; }
      } catch {}
    }

    // 普通 HTML
    const parsed = doParse(raw);
    confirmImport(parsed);
  };

  // ── 渲染 ──
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      {/* 推荐: 粘贴HTML */}
      <View style={{ backgroundColor: '#EBF5FF', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <Text style={{ color: '#1a1a1a', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>💡 推荐方式</Text>
        <Text style={{ color: '#555', fontSize: 12, lineHeight: 18 }}>
          在电脑浏览器登录教务系统 → 进入课表页面 → Ctrl+A 全选 → Ctrl+C 复制 → 粘贴到下面文本框
        </Text>
      </View>

      {/* 粘贴 HTML */}
      <View style={{ backgroundColor: '#f5f5f7', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 }}>粘贴课表页面 HTML</Text>
        <TextInput
          value={htmlInput}
          onChangeText={setHtmlInput}
          multiline
          numberOfLines={5}
          placeholder="在此粘贴..."
          style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, fontSize: 12, minHeight: 100, textAlignVertical: 'top', marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' }}
        />
        <TouchableOpacity
          onPress={() => htmlInput && confirmImport(doParse(htmlInput))}
          style={{ backgroundColor: '#4A90D9', borderRadius: 8, padding: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>解析并导入</Text>
        </TouchableOpacity>
        {parseResult && (
          <Text style={{ fontSize: 12, color: '#10B981', marginTop: 8 }}>
            找到 {parseResult.total} 门课程: {parseResult.names.slice(0, 5).join('、')}{parseResult.names.length > 5 ? '...' : ''}
          </Text>
        )}
      </View>

      {/* 或: WebView 模式 */}
      <View style={{ backgroundColor: '#f5f5f7', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 }}>或者：在应用内登录教务系统</Text>

        <TextInput
          value={schoolQuery}
          onChangeText={handleSearch}
          placeholder="搜索学校名称..."
          style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 4, borderWidth: 1, borderColor: '#e0e0e0' }}
        />
        {matchedSchools.slice(0, 6).map(s => (
          <TouchableOpacity
            key={s.name}
            onPress={() => { setUrl(s.urls[0]); setSchoolQuery(s.name); }}
            style={{ paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' }}
          >
            <Text style={{ fontSize: 14 }}>{s.name} <Text style={{ color: '#aaa', fontSize: 11 }}>{s.province}</Text></Text>
          </TouchableOpacity>
        ))}
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="或直接输入网址"
          style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, fontSize: 14, marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' }}
        />
        <TouchableOpacity
          onPress={() => url && setShowWebView(true)}
          style={{ backgroundColor: '#10B981', borderRadius: 8, padding: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>🌐 打开网页</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      {showWebView && (
        <View style={{ height: 520, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <TouchableOpacity onPress={() => setShowWebView(false)}>
              <Text style={{ color: '#4A90D9', fontSize: 14 }}>← 关闭</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: '#999' }}>登录后进课表页→点抓取</Text>
          </View>

          <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
            <WebView
              ref={webRef}
              source={{ uri: url }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              onMessage={(e) => handleWebViewMessage(e.nativeEvent.data)}
            />
          </View>

          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              onPress={triggerFetch}
              style={{ backgroundColor: '#4A90D9', borderRadius: 8, padding: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {loading ? '⏳ 解析中...' : '📥 抓取课程数据'}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
              登录 → 进课表页面 → 点上方按钮
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
