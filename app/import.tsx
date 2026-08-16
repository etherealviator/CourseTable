import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useTimetable } from '../src/features/timetable/store';
import { parseCourseTable, parseGridData } from '../src/features/import/parser';
import { searchSchools, loadSchools, SchoolEntry } from '../src/features/import/schools';
import { generateId } from '../src/shared/utils/time';
import { COURSE_COLORS } from '../src/shared/constants/theme';

/**
 * 教务系统课表抓取注入脚本
 * 支持: 正方/青果/URP/强智/金智 等主流系统
 * 策略: API直取 → 页面DOM提取 → HTML全文回传
 */
const FETCH_SCRIPT = `
(async function() {
  try {
    // 执行确认——注入成功与否一眼可见
    window.ReactNativeWebView.postMessage('__START__');
    var baseUrl = window.location.origin;
    var pathname = window.location.pathname;

    function postMsg(type, data) {
      window.ReactNativeWebView.postMessage(type + JSON.stringify(data));
    }
    function errMsg(text) {
      window.ReactNativeWebView.postMessage('__ERR__' + text);
    }

    // === 1. 候选学年学期（依次尝试，取第一个有数据的） ===
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth() + 1;
    var termCandidates = [];
    var seenTerms = {};
    function pushTerm(xn, xq) {
      var k = xn + '|' + xq;
      if (seenTerms[k]) return;
      seenTerms[k] = true;
      termCandidates.push([xn, xq]);
    }
    // 页面下拉优先（正方 xnm=学年 xqm=学期，石铁大 3=秋/12=春/16=夏）
    var xnSel = null, xqSel = null;
    try {
      var s1 = document.querySelector('select[name=xnm],select[name=XN],select[name=xn]');
      var s2 = document.querySelector('select[name=xqm],select[name=XQ],select[name=xq]');
      if (s1 && s1.value) xnSel = s1.value;
      if (s2 && s2.value) xqSel = s2.value;
    } catch(e) {}
    if (xnSel) {
      var xq1 = xqSel || '3';
      pushTerm(xnSel, xq1);                     // 页面选中项（石铁大: 2026-2027秋 = xnm=2026 xqm=3）
      pushTerm(String(parseInt(xnSel, 10) - 1), xq1); // 上一学年同学期
      pushTerm(xnSel, xq1 === '3' ? '12' : '3');      // 同学年另一学期
    } else {
      // 无下拉时的日期推断
      if (m === 8) {
        pushTerm(String(y), '3');         // 下学期(新学年秋)
        pushTerm(String(y - 1), '3');     // 本学年秋
        pushTerm(String(y - 1), '12');    // 本学年春
      } else if (m >= 9) {
        pushTerm(String(y - 1), '3');
        pushTerm(String(y - 1), '12');
      } else if (m >= 2 && m <= 7) {
        pushTerm(String(y - 1), '12');
        pushTerm(String(y - 1), '3');
      } else { // 1月
        pushTerm(String(y - 1), '3');
        pushTerm(String(y - 1), '12');
      }
    }

    // === 2. 扫描文档(含 iframe)里的课表 ===
    function scanDoc(doc) {
      if (!doc || !doc.body) return null;
      var body = doc.body.innerText || '';
      if (!/课程名称|kcmc|高等数学|大学英语|大学物理|毛泽东思想/.test(body) &&
          !doc.querySelector('.course-table, .kbTable, #kbTable, #kbtable, .grid-layout, .kb_content, .ui-jqgrid-btable, .report_tSxsgrkbcx')) {
        return null;
      }
      var grids = doc.querySelectorAll('.ui-jqgrid-btable, table.kbTable, table#kbTable, table#kbtable, .report_tSxsgrkbcx');
      for (var g = 0; g < grids.length; g++) {
        var rows = grids[g].querySelectorAll('tbody tr');
        if (rows.length > 3) {
          // 读表头列名(th)，把 colN 映射成 parseJsonCourses 认识的字段名
          var headers = [];
          var ths = grids[g].querySelectorAll('thead th, .ui-jqgrid-htable th, tr:first-child th');
          for (var h = 0; h < ths.length; h++) headers.push(ths[h].textContent.trim());
          var data = [];
          for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll('td');
            if (cells.length > 0) {
              var row = {};
              for (var c = 0; c < cells.length; c++) {
                var txt = cells[c].textContent.trim();
                var colName = 'col' + c;
                if (headers[c]) {
                  var hd = headers[c];
                  if (/课程名称|课程名|课名|kcmc/i.test(hd)) colName = 'kcmc';
                  else if (/教师|老师|任课|jsxm/i.test(hd)) colName = 'jsxm';
                  else if (/教室|地点|jsmc|cdmc/i.test(hd)) colName = 'jsmc';
                  else if (/星期|周几|周次日|xqj/i.test(hd)) colName = 'xqj';
                  else if (/节次|节数|jcor|skjc/i.test(hd)) colName = 'jcor';
                  else if (/周次|起止周|上课周|zcd/i.test(hd)) colName = 'zcd';
                }
                row[colName] = txt;
              }
              data.push(row);
            }
          }
          if (data.length > 0) return data;
        }
      }
      return null;
    }

    // === 2.5 找含星期表头的课表表格（不依赖已知class，石铁大适用） ===
    function findCourseTable(doc) {
      if (!doc) return null;
      var tables = doc.querySelectorAll('table');
      for (var i = 0; i < tables.length; i++) {
        try {
          var txt = tables[i].innerText || '';
          if (!/星期/.test(txt)) continue;
          if (!/课程|教师|教室|kcmc|jsxm|jsmc/.test(txt)) continue;
          if (tables[i].querySelectorAll('tr').length < 4) continue;
          // 课表特征: 表头含"节次/时间"（排除实践课记录等字段列表型表格）
          var firstRow = tables[i].querySelector('tr');
          var headerTxt = firstRow ? (firstRow.innerText || '') : '';
          if (!/节次|时间|上课/.test(headerTxt)) continue;
          var html = tables[i].outerHTML;
          if (html && html.length > 500 && html.length < 200000) return html;
        } catch(e4) {}
      }
      return null;
    }

    // === 3. 主文档 + iframe 逐层提取（老版正方课表常在 iframe 里） ===
    var pageData = scanDoc(document);
    if (pageData) { postMsg('__JQGRID__', pageData); return; }
    try {
      var frames = document.querySelectorAll('iframe');
      for (var f = 0; f < frames.length; f++) {
        var fdoc = null;
        try {
          fdoc = frames[f].contentDocument || (frames[f].contentWindow && frames[f].contentWindow.document);
        } catch(e2) {}
        if (!fdoc) continue;
        var fdata = scanDoc(fdoc);
        if (fdata) { postMsg('__JQGRID__', fdata); return; }
      }
    } catch(e3) {}

    // === 3.5 课表表格 outerHTML 回传（含"星期"表头的表格，RN 侧 table 策略解析） ===
    var tableHtml = findCourseTable(document);
    if (!tableHtml) {
      try {
        var frames2 = document.querySelectorAll('iframe');
        for (var f2 = 0; f2 < frames2.length; f2++) {
          var fdoc2 = null;
          try { fdoc2 = frames2[f2].contentDocument || (frames2[f2].contentWindow && frames2[f2].contentWindow.document); } catch(e5) {}
          if (!fdoc2) continue;
          tableHtml = findCourseTable(fdoc2);
          if (tableHtml) break;
        }
      } catch(e6) {}
    }
    if (tableHtml) { postMsg('__TABLEHTML__', tableHtml); return; }

    // === 4. API 直取（路径 × 候选学期，第一个非空即返回） ===
    var apiTests = [
      '/kbcx/xskbcx_cxXsgrkb.html?gnmkdm=N2151',
      '/jwglxt/kbcx/xskbcx_cxXsgrkb.html?gnmkdm=N2151',
      '/xskb/xskb_list.do',
      '/teach/student/courseTable',
      '/api/student/courseTable',
      '/student/courseTable/query',
      '/app/std/courseTable/query',
    ];
    // 只有含课表特征字段的对象才算课表（排除教室/场地等无关数组）
    function looksLikeCourse(item) {
      if (!item || typeof item !== 'object') return false;
      var s = JSON.stringify(item);
      return /kcmc|xqj|jcor|zcd|jsxm|jsmc|课程名|教师|星期|节次|周次/.test(s);
    }
    var triedCount = 0;
    for (var p = 0; p < apiTests.length; p++) {
      var bi = p < 2 ? 0 : (p === 2 ? 1 : 2);
      var terms = (bi === 0) ? termCandidates : (termCandidates.length ? [termCandidates[0]] : []);
      for (var t = 0; t < terms.length; t++) {
        var tc = terms[t];
        var body;
        if (bi === 0) body = 'xnm=' + tc[0] + '&xqm=' + tc[1] + '&kzlx=ck';
        else if (bi === 1) body = 'xnxq=' + tc[0] + tc[1] + '&showType=detail';
        else body = 'year=' + tc[0] + '&term=' + tc[1] + '&semester=' + tc[1];
        triedCount++;
        try {
          var resp = await fetch(baseUrl + apiTests[p], {
            method: 'POST', credentials: 'include',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: body
          });
          if (resp.ok) {
            var text = await resp.text();
            if (!text || text.length < 10) continue;
            var obj = null;
            try { obj = JSON.parse(text); } catch(e) {}
            if (obj) {
              if (obj.kbList && obj.kbList.length > 0) { postMsg('__JSON__', obj.kbList); return; }
              if (Array.isArray(obj) && obj.length > 0 && looksLikeCourse(obj[0])) { postMsg('__JSON__', obj); return; }
              for (var k in obj) {
                if (Array.isArray(obj[k]) && obj[k].length > 0 && typeof obj[k][0] === 'object' && looksLikeCourse(obj[k][0])) {
                  postMsg('__JSON__', obj[k]); return;
                }
              }
            }
          }
        } catch(e) {}
      }
    }

    // === 5. 诊断（不再回传整页HTML——postMessage 大消息会截断损坏） ===
    var termInfo = [];
    for (var ti = 0; ti < termCandidates.length; ti++) termInfo.push(termCandidates[ti][0] + '学年第' + termCandidates[ti][1] + '学期');
    postMsg('__INFO__', 'API直取失败(已尝试' + triedCount + '次请求)，候选学期: ' + termInfo.join(' / ') + '。可改用方式一：复制课表页HTML粘贴导入');
  } catch(e) {
    window.ReactNativeWebView.postMessage('__ERR__' + '脚本异常: ' + e.message);
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

        // 节次: "3-4" / "3" / "0102"(四位数字) / "1-2节" 格式
        let periods = item.jcs || item.jcor || item.sections || item['节次'] || '';
        let startPeriod = 1, endPeriod = 2;
        const pm = periods.match(/(\d+)\s*[-~]\s*(\d+)/);
        if (pm) {
          startPeriod = parseInt(pm[1]);
          endPeriod = parseInt(pm[2]);
        } else if (/^\d{4}$/.test(periods)) {
          // 正方老版 "0102" = 第1-2节
          startPeriod = parseInt(periods.slice(0, 2), 10);
          endPeriod = parseInt(periods.slice(2), 10);
          if (!endPeriod || endPeriod < startPeriod) endPeriod = startPeriod;
        } else if (periods) {
          startPeriod = parseInt(periods) || 1;
          endPeriod = startPeriod;
        }

        // 周次: "1-16周" "1-16周(单)" "1,3,5,7" "1-16周{第1-16周|单周}"
        let weeks: number[] = [];
        const weekStr = item.zcd || item.weeks || item['周次'] || '';
        // 逗号枚举
        if (/[,，]/.test(weekStr)) {
          const nums = weekStr.match(/\d+/g);
          if (nums) weeks = nums.map((n: string) => parseInt(n)).filter((n: number) => n >= 1 && n <= 30);
        }
        if (weeks.length === 0) {
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

    if (raw.startsWith('__START__')) {
      setStatusText('✓ 脚本已执行');
      return;
    }

    if (raw.startsWith('__INFO__')) {
      setStatusText(raw.slice(7));
      // 诊断信息强制弹窗可见——API 直取失败原因就藏在这里
      Alert.alert('获取失败（诊断）', raw.slice(7));
      return;
    }

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

    // Fallback: jqGrid
    if (raw.startsWith('__JQGRID__')) {
      try {
        const items = JSON.parse(raw.slice(10));
        const parsed = parseJsonCourses(items);
        if (parsed.length > 0) { parseAndImport(parsed); return; }
      } catch {}
    }

    // 课表表格 outerHTML：走完整解析链（json/table/td 策略）
    if (raw.startsWith('__TABLEHTML__')) {
      const html = raw.slice(13);
      const parsed = parseCourseTable(html);
      if (parsed.length > 0) {
        parseAndImport(parsed.map(p => ({kcmc: p.name, xm: p.teacher, cdmc: p.location, xqj: String(p.dayOfWeek), jcs: p.periods, zcd: p.weeks})));
        return;
      }
      Alert.alert('未识别到课程', '表格已找到但解析失败，请改用方式一粘贴课表页内容');
      return;
    }

    // HTML 回退：用 table 解析器
    if (raw.startsWith('__HTML__')) {
      const html = raw.slice(7);
      const parsed = parseCourseTable(html);
      if (parsed.length > 0) { parseAndImport(parsed.map(p => ({kcmc: p.name, xm: p.teacher, cdmc: p.location, xqj: String(p.dayOfWeek), jcs: p.periods, zcd: p.weeks}))); return; }
      // 从 HTML 里找 JSON 变量
      const jqMatch = html.match(/var\s+\w+\s*=\s*(\[[\s\S]*?\])\s*;/);
      if (jqMatch) {
        try { const items = JSON.parse(jqMatch[1]); const mapped = parseJsonCourses(items); if (mapped.length > 0) { parseAndImport(mapped); return; } } catch {}
      }
      Alert.alert('未识别到课程', '没找到课程数据，请确认已登录教务系统并位于课表页面');
      return;
    }

    // 试试 JSON 解析
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) { parseAndImport(data); return; }
      if (data.kbList) { parseAndImport(data.kbList); return; }
    } catch {}

    // 未识别的消息：显示原文帮助诊断
    Alert.alert('收到未识别消息', (raw || '').slice(0, 200));
  };

  if (showWebView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          <TouchableOpacity onPress={() => setShowWebView(false)}>
            <Text style={{ color: '#4A90D9', fontSize: 14 }}>← 关闭</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#999' }}>登录后点下方抓取</Text>
        </View>

        <View style={{ flex: 1, overflow: 'hidden' }}>
          <WebView
            ref={webRef}
            source={{ uri: url }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(request) => {
              // 教务系统 target=_blank / 新窗口跳转一律留在 WebView 内，不交给系统浏览器
              return true;
            }}
            onMessage={(e) => handleWebViewMessage(e.nativeEvent.data)}
          />
        </View>

        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#eee' }}>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              setStatusText('');
              webRef.current?.injectJavaScript(FETCH_SCRIPT);
            }}
            style={{ backgroundColor: '#4A90D9', borderRadius: 8, padding: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {loading ? '⏳ 获取中...' : '📥 一键获取课程数据'}
            </Text>
          </TouchableOpacity>
          {statusText ? <Text style={{ fontSize: 12, color: '#10B981', textAlign: 'center', marginTop: 8 }}>{statusText}</Text> : null}
        </View>
      </View>
    );
  }

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

            // 尝试 HTML table 解析
            const htParsed = parseCourseTable(htmlInput);
            if (htParsed.length > 0) {
              parseAndImport(htParsed.map(p => ({kcmc: p.name, xm: p.teacher, cdmc: p.location, xqj: String(p.dayOfWeek), jcs: p.periods, zcd: p.weeks})));
              return;
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

    </ScrollView>
  );
}
