/** 不是课程名的文本模式黑名单 */
const NON_COURSE_PATTERNS = [
  /^教学班组成/,
  /^星期一$/,
  /^星期二$/,
  /^星期三$/,
  /^星期四$/,
  /^星期五$/,
  /^星期六$/,
  /^星期日$/,
  /^周一$/,
  /^周二$/,
  /^周三$/,
  /^周四$/,
  /^周五$/,
  /^周六$/,
  /^周日$/,
  /^1[.]?\s*$/, /^2[.]?\s*$/, /^3[.]?\s*$/, /^4[.]?\s*$/, /^5[.]?\s*$/,
  /^6[.]?\s*$/, /^7[.]?\s*$/, /^8[.]?\s*$/,
  /^(上午|下午|晚上|中午)$/,
  /^(学号|姓名|班级|专业|学院|系别|年级)$/,
  /^(男|女)$/,
  /^\d{8,}$/,  // 长数字（学号）
  /^管\d{4}[-]\d+$/,  // 班级名 管2304-1
  /^\d{4}[-]\d+[-]\d+$/,  // 学号模式
  /^(学生|教师|管理员)$/,
];

/** 从文本中提取真正的课程名 */
export function extractName(text: string): string {
  const cleaned = text
    .replace(/[（(][^)）]*[)）]/g, '')
    .replace(/\[\d+[-~]\d+周\]/g, '')
    .trim();

  // 如果整个文本就是非课程模式, 返回空
  if (NON_COURSE_PATTERNS.some(p => p.test(cleaned))) return '';

  const words = cleaned.split(/[\s\n;；,，]+/).filter(w => w.trim().length > 0);
  let best = '';

  for (const w of words) {
    const t = w.trim();
    if (!t) continue;
    if (/^\d+$/.test(t)) continue;
    if (/^\d+[-~]\d+$/.test(t)) continue;
    if (/^[A-Z]+\d{2,}$/i.test(t)) continue;
    if (/^第?\d+[-~]?\d*[节周]$/.test(t)) continue;
    if (t === '单周' || t === '双周') continue;
    if (NON_COURSE_PATTERNS.some(p => p.test(t))) continue;
    // 班级名/学号模式
    if (/^[\u4e00-\u9fff]+\d{3,}[-]\d+$/.test(t)) continue;
    if (/^\d{8,}$/.test(t)) continue;

    if (/[\u4e00-\u9fff]/.test(t) && t.length > best.length) {
      best = t;
    }
  }

  // fallback: 取第一个看起来像词的
  if (!best) {
    for (const w of words) {
      const t = w.trim();
      if (t.length >= 2 && /[\u4e00-\u9fff]/.test(t) && !NON_COURSE_PATTERNS.some(p => p.test(t))) {
        best = t;
        break;
      }
    }
  }

  return best;
}

/** 提取教师名 — 只返回真正的姓名, 不返回班级名/学号 */
export function extractTeacher(text: string): string {
  // 显式标记
  const m = text.match(/(?:教师|老师|任课|主讲|授课教师)[：:]\s*(\S{2,4})/);
  if (m) return m[1];

  for (const w of text.split(/[\s\n;；,，]+/)) {
    const t = w.trim();
    if (!t) continue;
    // 真正的教师名: 2-4个汉字, 不包含数字/特殊字符
    if (/^[\u4e00-\u9fff]{2,4}$/.test(t) && !/^\d+$/.test(t)) {
      // 排除班级名模式（管2304-1这类）
      if (/^[\u4e00-\u9fff].*\d/.test(t)) continue;
      // 排除星期
      if (/^周[一二三四五六日天]$/.test(t)) continue;
      return t;
    }
  }
  return '';
}

/** 提取教室编号 */
export function extractLocation(text: string): string {
  const m = text.match(/(?:教室|地点|位置|教学楼|实验楼)[：:]\s*(\S+)/);
  if (m) return m[1];
  for (const w of text.split(/[\s\n]+/)) {
    const t = w.trim();
    if (/^[A-Z]{1,3}\d{3,5}$/i.test(t)) return t.toUpperCase();
    if (/^教\d+[-]\d+$/.test(t)) return t;
    if (/^实\d+$/.test(t)) return t;
  }
  return '';
}

/** 提取节次范围 */
export function extractPeriods(text: string): string {
  const m = text.match(/第?(\d+)\s*[-~]\s*(\d+)\s*节?/);
  if (m) return `${m[1]}-${m[2]}`;
  const single = text.match(/(\d+)\s*节/);
  if (single) return `${single[1]}-${single[1]}`;
  return '';
}

/** 提取周次范围 */
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

/** 判断一段文本是否看起来像真正的课程数据 —— 必须有课程名+教师/教室/周次之一 */
export function isPlausibleCourse(text: string): boolean {
  const name = extractName(text);
  if (!name || name.length < 2) return false;
  // 排除非课程模式
  if (NON_COURSE_PATTERNS.some(p => p.test(text))) return false;

  // 真正的课程通常包含额外信息: 教师或教室或周次
  const teacher = extractTeacher(text);
  const location = extractLocation(text);
  const weeks = extractWeeks(text);

  // 如果只有课程名, 长度至少3个字（排除"星期一"等2字非课程词）
  if (!teacher && !location && !weeks) {
    return name.length >= 3;
  }

  return true;
}
