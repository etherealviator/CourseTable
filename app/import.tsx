import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useTimetable } from '../src/features/timetable/store';
import { searchSchools, loadSchools, SchoolEntry } from '../src/features/import/schools';
import { generateId } from '../src/shared/utils/time';
import { COURSE_COLORS } from '../src/shared/constants/theme';

/**
 * 正方教务系统 JSON API 注入脚本
 * 1. 先获取学年学期
 * 2. 然后调 API 拿课表 JSON
 * 3. 发回 RN
 */
const FETCH_SCRIPT = `
(async function() {
  try {
    // 获取当前页的 base URL
    var baseUrl = window.location.origin;

    // 第一步: 获取学年学期
    var xnm = '', xqm = '';
    try {
      // 从页面选择器中读选中值
      var selects = document.querySelectorAll('select');
      for (var s = 0; s < selects.length; s++) {
        var opt = selects[s].querySelector('option[selected]');
        if (!opt) {
          opt = selects[s].querySelector('option');
        }
        if (opt && opt.value) {
          var val = opt.value.trim();
          if (/^\\d{4}$/.test(val)) { xnm = val; }
          else if (/^\\d{1,2}$/.test(val)) { xqm = val; }
        }
      }
    } catch(e) {}

    if (!xnm || !xqm) {
      // fallback: 从 URL 或常见值
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth() + 1;
      xnm = m >= 9 ? y : (m <= 2 ? y-1 : y-1);
      xnm = xnm + '-' + (parseInt(xnm)+1);
      xqm = (m >= 2 && m <= 7) ? '2' : '1';
    }

    // 第二步: 调 API
    var apiUrl = baseUrl + '/kbcx/xskbcx_cxXsgrkb.html?gnmkdm=N2151&su=';

    var formData = 'xnm=' + xnm.split('-')[0] + '&xqm=' + xqm + '&kzlx=ck&xsdm=';

    var resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: formData
    });
    var json = await resp.json();

    if (json && json.kbList && json.kbList.length > 0) {
      window.ReactNativeWebView.postMessage('__JSON__' + JSON.stringify(json.kbList));
    } else {
      window.ReactNativeWebView.postMessage('__ERR__未找到课程数据，请确认已登录教务系统');
    }
  } catch(e) {
    window.ReactNativeWebView.postMessage('__ERR__' + e.message);
  }
})();
true;
`;

/**
 * 解析 jqGrid 或 JSON 数据
 */
function parseJsonCourses(items: any[]): any[] {
  return items.map((item: any) => ({
    name: item.kcmc || item.kc || item.name || item['课程名'] || '',
    teacher: item.xm || item.jsxm || item.teacher || item['教师'] || '',
    location: item.cdmc || item.jsmc || item.location || item['教室'] || '',
    dayOfWeek: parseInt(item.xqj || item.day || item['星期'] || '1'),
    periods: item.jcs || item.jcor || item.sections || item['节次'] || '',
    weeks: item.zcd || item.weeks || item['周次'] || '',
  }));
}

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
  const [statusText, setStatusText] = useState('');

  const handleSearch = async (q: string) => {
    setSchoolQuery(q);
    const schools = await loadSchools();
    setMatchedSchools(searchSchools(q, schools));
  };

  const parseAndImport = (items: any[]) => {
    const courses = items
      .filter((item: any) => {
        const name = item.kcmc || item.kc || item.name || item['课程名'] || item.name || '';
        return name && name.length >= 2;
      })
      .map((item: any) => {
        const name = item.kcmc || item.kc || item.name || item['课程名'] || item.name || '';
        const teacher = item.xm || item.jsxm || item.teacher || item['教师'] || '';
        const location = item.cdmc || item.jsmc || item.location || item['教室'] || '';

        let dayOfWeek = parseInt(item.xqj || item.day || item['星期'] || '1');
        if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) dayOfWeek = 1;

        // 节次: "3-4" 或 "3" 格式
        let periods = item.jcs || item.jcor || item.sections || item['节次'] || '';
        let startPeriod = 1, endPeriod = 2;
        const pm = periods.match(/(\d+)\s*[-~]\s*(\d+)/);
        if (pm) {
          startPeriod = parseInt(pm[1]);
          endPeriod = parseInt(pm[2]);
        } else if (periods) {
          startPeriod = parseInt(periods) || 1;
          endPeriod = startPeriod;
        }

        // 周次: "1-16周" "1-16周(单)" "1,3,5"
        let weeks: number[] = [];
        const weekStr = item.zcd || item.weeks || item['周次'] || '';
        const wRange = weekStr.match(/(\d+)\s*[-~]\s*(\d+)/);
        if (wRange) {
          const isOdd = /单/.test(weekStr);
          const isEven = /双/.test(weekStr);
          for (let i = parseInt(wRange[1]); i <= parseInt(wRange[2]); i++) {
            if (isOdd && i % 2 === 0) continue;
            if (isEven && i % 2 === 1) continue;
            weeks.push(i);
          }
        }
        if (weeks.length === 0) {
          weeks = Array.from({ length: 18 }, (_, i) => i + 1);
        }

        return {
          id: generateId(),
          name,
          teacher,
          location,
          dayOfWeek,
          startPeriod,
          endPeriod,
          weeks,
          color: COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)],
        };
      });

    if (courses.length === 0) {
      Alert.alert('未识别到课程', '没有找到有效的课程数据');
      setLoading(false);
      return;
    }

    const sample = courses.slice(0, 10).map((c, i) =>
      `  ${i+1}. ${c.name}${c.teacher ? ' ('+c.teacher+')' : ''}`
    ).join('\n');

    Alert.alert(
      `找到 ${courses.length} 门课程`,
      sample + '\n\n确认导入？',
      [
        { text: '取消', style: 'cancel', onPress: () => { setLoading(false); setShowWebView(false); }},
        {
          text: '✅ 导入',
          onPress: () => {
            importCourses(courses);
            setLoading(false);
            setStatusText(`已导入 ${courses.length} 门课程`);
            setTimeout(() => router.back(), 500);
          },
        },
      ]
    );
  };

  const handleWebViewMessage = (raw: string) => {
    setLoading(false);

    if (raw.startsWith('__JSON__')) {
      try {
        const items = JSON.parse(raw.slice(7));
        if (Array.isArray(items)) {
          parseAndImport(items);
          return;
        }
      } catch {}
    }

    if (raw.startsWith('__ERR__')) {
      Alert.alert('获取失败', raw.slice(7));
      return;
    }

    // Fallback: 尝试 HTML table 解析 or jqGrid
    if (raw.startsWith('__JQGRID__')) {
      try {
        const items = JSON.parse(raw.slice(9));
        const parsed = parseJsonCourses(items);
        if (parsed.length > 0) { parseAndImport(parsed); return; }
      } catch {}
    }

    // 纯 HTML
    try {
      const parsed = parseJsonCourses(JSON.parse(raw));
      if (parsed.length > 0) { parseAndImport(parsed); return; }
    } catch {}

    // 粘贴 HTML 模式: 从 HTML 中提取 JSON
    const jqMatch = raw.match(/var\s+\w+\s*=\s*(\[[\s\S]*?\])\s*;/);
    if (jqMatch) {
      try {
        const items = JSON.parse(jqMatch[1]);
        const parsed = parseJsonCourses(items);
        if (parsed.length > 0) { parseAndImport(parsed); return; }
      } catch {}
    }

    Alert.alert('未识别到课程', '没找到课程数据，请确认已登录教务系统并位于课表页面');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      {/* 步骤提示 */}
      <View style={{ backgroundColor: '#F0F7FF', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 }}>📥 导入课程表</Text>
        <Text style={{ fontSize: 13, color: '#555', lineHeight: 20 }}>
          两种方式：{'\n'}
          1️⃣ 直接粘贴教务系统课表页面的 HTML{'\n'}
          2️⃣ 在应用内登录教务系统，自动抓取
        </Text>
      </View>

      {/* 方式1: 粘贴 HTML */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }}>方式一：粘贴 HTML</Text>
        <Text style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
          浏览器打开教务课表页面 → Ctrl+A → Ctrl+C → 粘贴到下面
        </Text>
        <TextInput
          value={htmlInput}
          onChangeText={setHtmlInput}
          multiline
          numberOfLines={5}
          placeholder="在此粘贴..."
          style={{ backgroundColor: '#f5f5f7', borderRadius: 8, padding: 10, fontSize: 12, minHeight: 100, textAlignVertical: 'top', marginBottom: 8, borderWidth: 1, borderColor: '#e8e8e8' }}
        />
        <TouchableOpacity
          onPress={() => {
            if (!htmlInput) return;
            setLoading(true);
            // 尝试提取 JSON
            try {
              const data = JSON.parse(htmlInput);
              if (Array.isArray(data)) {
                parseAndImport(data);
                return;
              }
              if (data.kbList) {
                parseAndImport(data.kbList);
                return;
              }
            } catch {}

            // 从 HTML 中找 JSON 变量
            const m = htmlInput.match(/var\s+\w+\s*=\s*(\[[\s\S]*?\])\s*;/);
            if (m) {
              try {
                const items = JSON.parse(m[1]);
                parseAndImport(items);
                return;
              } catch {}
            }

            setLoading(false);
            Alert.alert('未识别', '没找到课程数据，试试方式二');
          }}
          style={{ backgroundColor: '#4A90D9', borderRadius: 8, padding: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            {loading ? '⏳ 解析中...' : '解析并导入'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 方式2: WebView */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }}>方式二：应用内登录</Text>

        <TextInput
          value={schoolQuery}
          onChangeText={handleSearch}
          placeholder="搜索学校名称..."
          style={{ backgroundColor: '#f5f5f7', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 4, borderWidth: 1, borderColor: '#e8e8e8' }}
        />
        {matchedSchools.slice(0, 6).map(s => (
          <TouchableOpacity
            key={s.name}
            onPress={() => { setUrl(s.urls[0]); setSchoolQuery(s.name); }}
            style={{ paddingVertical: 6, borderBottomWidth: 1, borderColor: '#f0f0f0' }}
          >
            <Text style={{ fontSize: 14 }}>{s.name} <Text style={{ color: '#aaa', fontSize: 11 }}>{s.province}</Text></Text>
          </TouchableOpacity>
        ))}
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="或直接输入教务系统网址"
          style={{ backgroundColor: '#f5f5f7', borderRadius: 8, padding: 10, fontSize: 14, marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e8e8e8' }}
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
        <View style={{ height: 500, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <TouchableOpacity onPress={() => setShowWebView(false)}>
              <Text style={{ color: '#4A90D9', fontSize: 14 }}>← 关闭</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: '#999' }}>登录后点下方抓取</Text>
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

          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              setStatusText('');
              webRef.current?.injectJavaScript(FETCH_SCRIPT);
            }}
            style={{ backgroundColor: '#4A90D9', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {loading ? '⏳ 获取中...' : '📥 一键获取课程数据'}
            </Text>
          </TouchableOpacity>
          {statusText ? <Text style={{ fontSize: 12, color: '#10B981', textAlign: 'center', marginTop: 4 }}>{statusText}</Text> : null}
        </View>
      )}
    </ScrollView>
  );
}
