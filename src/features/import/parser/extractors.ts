/** 从文本中提取课程名 —— 最长的含中文词 */
export function extractName(text: string): string {
  const words = text.split(/[\s\n]+/).filter(w => w.length > 0);
  let best = '';
  for (const w of words) {
    if (/^\d+$/.test(w)) continue;
    if (/^\d+[-~]\d+$/.test(w)) continue;
    if (/^[A-Z]+\d{2,}$/i.test(w)) continue;
    if (/^第?\d+[-~]?\d*[节周]$/.test(w)) continue;
    if (w === '单周' || w === '双周') continue;
    if (/[\u4e00-\u9fff]/.test(w) && w.length > best.length) { best = w; }
  }
  if (!best) best = words[0] || text.trim().split('\n')[0] || '';
  return best.replace(/[（(][^)）]*[)）]/g, '').replace(/\[\d+[-~]\d+周\]/g, '').trim();
}

/** 提取教师名 */
export function extractTeacher(text: string): string {
  const m = text.match(/(?:教师|老师|任课|主讲)[：:]\s*(\S{2,4})/);
  if (m) return m[1];
  for (const w of text.split(/[\s\n]+/)) {
    if (/^[\u4e00-\u9fff]{2,4}$/.test(w) && !/^\d+$/.test(w)) return w;
  }
  return '';
}

/** 提取教室编号 */
export function extractLocation(text: string): string {
  const m = text.match(/(?:教室|地点|位置|教学楼|实验楼)[：:]\s*(\S+)/);
  if (m) return m[1];
  for (const w of text.split(/[\s\n]+/)) {
    if (/^[A-Z]{1,3}\d{3,5}$/i.test(w)) return w.toUpperCase();
    if (/^教\d+[-]\d+$/.test(w)) return w;
    if (/^实\d+$/.test(w)) return w;
  }
  return '';
}

/** 提取节次范围 — 支持 "1-2节"、"第1-2节"、"第1-2" */
export function extractPeriods(text: string): string {
  const m = text.match(/第?(\d+)\s*[-~]\s*(\d+)/);
  if (m) return `${m[1]}-${m[2]}`;
  // 单节次 fallback
  const single = text.match(/(\d+)\s*节/);
  if (single) return `${single[1]}-${single[1]}`;
  return '';
}

/** 提取周次范围 — 支持 "1-18周"、"第1-18周"、"周次:1-18" */
export function extractWeeks(text: string): string {
  const patterns = [
    /(\d+)\s*[-~]\s*(\d+)\s*周/,
    /第(\d+)\s*[-~]\s*(\d+)\s*周/,
    /周次[：:]\s*(\d+)\s*[-~]\s*(\d+)/,
    /weeks?[：:]\s*(\d+)\s*[-~]\s*(\d+)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return `${m[1]}-${m[2]}`;
  }
  return '';
}
