// 教务系统课程表 HTML 解析器
// 支持多种常见教务系统的课程表格式

import { ParsedCourse, EduSystemType } from '../types';

/**
 * 教务系统模板配置
 */
export const EDU_TEMPLATES: Record<EduSystemType, {
  name: string;
  loginUrl: string;
  scheduleUrl: string;
  description: string;
}> = {
  zhengfang: {
    name: '正方教务系统',
    loginUrl: '',
    scheduleUrl: '',
    description: '适用于大部分高校的正方教务系统',
  },
  qingguo: {
    name: '青果教务系统',
    loginUrl: '',
    scheduleUrl: '',
    description: '适用于青果教务系统',
  },
  urp: {
    name: 'URP 教务系统',
    loginUrl: '',
    scheduleUrl: '',
    description: '适用于 URP 综合教务系统',
  },
  custom: {
    name: '通用导入',
    loginUrl: '',
    scheduleUrl: '',
    description: '手动粘贴课程表 HTML 进行解析',
  },
};

/**
 * 从 HTML 字符串中解析课程表
 * 自动适配多种教务系统表格格式
 */
export function parseCourseTable(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];

  // 尝试多种解析策略
  const strategies = [
    parseStandardTable,   // 标准课表表格
    parseDivLayout,       // div 布局型
    parseListView,        // 列表型
  ];

  for (const strategy of strategies) {
    const result = strategy(html);
    if (result.length > 0) {
      return cleanAndDeduplicate(result);
    }
  }

  return courses;
}

/**
 * 策略1: 标准 table 格式（最常见）
 * 行=节次, 列=星期
 */
function parseStandardTable(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];

  // 匹配 <table> 中包含课程信息的表格
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tableMatch[1];

    // 提取所有行
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows: string[][] = [];
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      const cells: string[] = [];
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, ' ').trim());
      }
      if (cells.length > 0) rows.push(cells);
    }

    // 判断是否为课程表（至少 6 列且第一行包含星期）
    if (rows.length >= 2 && rows[0].length >= 6) {
      const headerRow = rows[0].map(c => c.replace(/\s+/g, ''));
      const hasWeekday = headerRow.some(c =>
        /周[一二三四五六日]|星期[一二三四五六日]|周一|周二|周三|周四|周五|周六|周日|Mon|Tue|Wed|Thu|Fri|Sat|Sun/i.test(c)
      );

      if (hasWeekday || rows.length >= 5) {
        // 解析每行（每行对应一个时间段）
        for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
          const row = rows[rowIdx];
          // 第一列可能是节次信息
          const periodInfo = row[0] || '';
          const periods = extractPeriods(periodInfo);

          // 从第1列开始解析每天课程（跳过节次列）
          for (let colIdx = 1; colIdx < row.length && colIdx <= 7; colIdx++) {
            const cellText = row[colIdx] || '';
            if (!cellText || cellText === '&nbsp;' || cellText === ' ') continue;

            const parsed = parseCellContent(cellText, colIdx, periods);
            if (parsed) {
              courses.push(parsed);
            }
          }
        }
      }
    }
  }

  return courses;
}

/**
 * 策略2: div 布局型课表
 */
function parseDivLayout(html: string): ParsedCourse[] {
  // 匹配包含 "课程" "教师" "教室" 等关键词的 div
  const courses: ParsedCourse[] = [];

  const courseBlockRegex = /<div[^>]*class="[^"]*(?:course|kecheng|class-item|schedule)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match: RegExpExecArray | null;

  while ((match = courseBlockRegex.exec(html)) !== null) {
    const block = match[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (block.length < 3) continue;

    const parsed = parseCellContent(block, 1);
    if (parsed) courses.push(parsed);
  }

  return courses;
}

/**
 * 策略3: 列表/JSON 型
 */
function parseListView(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];

  // 尝试找 JSON 数据
  const jsonRegex = /(?:var|let|const)\s+\w+\s*=\s*(\[[\s\S]*?\])\s*;?/g;
  let jsonMatch: RegExpExecArray | null;

  while ((jsonMatch = jsonRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (Array.isArray(data)) {
        for (const item of data) {
          const course = parseJsonCourse(item);
          if (course) courses.push(course);
        }
      }
    } catch {
      // 不是有效 JSON，跳过
    }
  }

  return courses;
}

/**
 * 解析单个单元格内容为课程信息
 * 智能裁剪：只保留课程名、教师、地点
 */
function parseCellContent(
  text: string,
  dayOfWeek: number,
  periods?: string
): ParsedCourse | null {
  const cleaned = text
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .trim();

  if (cleaned.length < 2) return null;

  // 提取课程名 - 通常是第一段或最长的中文文本
  const name = extractCourseName(cleaned);

  // 提取教师名
  const teacher = extractTeacher(cleaned);

  // 提取地点
  const location = extractLocation(cleaned);

  // 提取周次信息
  const weeks = extractWeeks(cleaned);

  if (!name) return null;

  return {
    name,
    teacher,
    location,
    dayOfWeek,
    periods: periods || '',
    weeks,
  };
}

/**
 * 从 JSON 对象解析课程
 */
function parseJsonCourse(item: Record<string, unknown>): ParsedCourse | null {
  const name = String(item.kcm || item.courseName || item.name || item['课程名'] || '');
  if (!name || name === 'undefined') return null;

  return {
    name,
    teacher: String(item.jsxm || item.teacher || item['教师'] || item['任课教师'] || ''),
    location: String(item.jsmc || item.classroom || item.location || item['教室'] || item['上课地点'] || ''),
    dayOfWeek: Number(item.xqj || item.day || item.weekDay || item['星期'] || 1),
    periods: String(item.jcor || item.periods || item.sessions || item['节次'] || ''),
    weeks: String(item.zc || item.weeks || item.weekDescription || item['周次'] || ''),
  };
}

// ============ 信息提取辅助函数 ============

/**
 * 提取课程名 - 裁剪掉无用信息
 */
function extractCourseName(text: string): string {
  // 移除常见的无用前缀/后缀
  let name = text;

  // 移除括号中的周次/节次信息
  name = name.replace(/[（(]\s*(?:第?\d+[-~]?\d*周|周[一二三四五六日]|单周|双周|第\d+[-~]\d+节)\s*[）)]/g, '');

  // 移除教师信息模式
  name = name.replace(/\s*(?:教师|老师|任课)[：:]\s*\S+/g, '');
  name = name.replace(/\s*\S{2,4}(?:老师|教授|讲师)\s*/g, '');

  // 移除地点信息模式
  name = name.replace(/\s*(?:教室|地点|位置)[：:]\s*\S+/g, '');
  name = name.replace(/\s*[A-Z]+\d{3,4}\s*/g, ''); // 如 A101

  // 移除节次信息
  name = name.replace(/\s*第?\d+[-~]?\d*节\s*/g, '');

  // 取最可能的课程名（中文字符较多的部分）
  const parts = name.split(/[\s,，、]+/).filter(p => p.length > 0);
  const chineseParts = parts.filter(p => /[\u4e00-\u9fff]/.test(p));

  if (chineseParts.length > 0) {
    // 返回最长的中文片段作为课程名
    return chineseParts.reduce((a, b) => a.length >= b.length ? a : b);
  }

  // 如果没有中文，返回第一个非空片段
  return parts[0] || name.trim();
}

/**
 * 提取教师名
 */
function extractTeacher(text: string): string {
  // 匹配 "教师：XXX" "任课教师：XXX" "XXX老师" 等模式
  const patterns = [
    /(?:教师|老师|任课|任课教师|授课教师)[：:]\s*(\S{2,4})/,
    /(\S{2,4})\s*(?:老师|教授|讲师)/,
    /\s([A-Z][a-z]+\s[A-Z][a-z]+)\s/, // 英文名
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

/**
 * 提取上课地点
 */
function extractLocation(text: string): string {
  // 匹配常见教室格式：字母+数字 (如 A101, 教1-201, 实301)
  const patterns = [
    /(?:教室|地点|位置|上课地点)[：:]\s*(\S+)/,
    /([A-Z]+[-]?\d{3,5})/,
    /(教\d+[-]\d+)/,
    /(实\d+)/,
    /(?:楼)\s*(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

/**
 * 提取周次范围
 */
function extractWeeks(text: string): string {
  const patterns = [
    /(\d+[-~]\d+)\s*周/,
    /第?(\d+[-~]\d+)周/,
    /周次[：:]\s*(\d+[-~]\d+)/,
    /weeks?[：:]\s*(\d+[-~]\d+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return '';
}

/**
 * 提取节次范围
 */
function extractPeriods(text: string): string {
  const match = text.match(/(\d+[-~]\d+)\s*节/);
  return match ? match[1] : '';
}

/**
 * 清理和去重
 */
function cleanAndDeduplicate(courses: ParsedCourse[]): ParsedCourse[] {
  const seen = new Set<string>();
  return courses.filter(c => {
    const key = `${c.name}|${c.dayOfWeek}|${c.periods}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).filter(c => c.name.length >= 2); // 过滤太短的
}
