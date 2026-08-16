import { ParsedCourse } from '../../../../shared/types';
import { extractName, extractTeacher, extractLocation, extractWeeks, isPlausibleCourse } from '../extractors';

/**
 * 老版正方课表页 td 内容解析
 *
 * 老版正方（石铁大 /kbcx/ 系）课表不是标准"星期表头"表格，而是每个 td 一格，
 * 内容自带完整信息，典型格式（&nbsp; 分隔）:
 *   高等数学A 2304-2班 1-16周 星期一 第1-2节 教0-216 张三
 *
 * 因此不依赖行列位置，直接对每个 td 文本提取课程名/星期/节次/周次/教师/教室。
 * 参考 WakeUp 课程表 o0OOOO00 parser 的同类做法（.report_tSxsgrkbcx 下 td 遍历）。
 */

const DAY_MAP: Record<string, number> = {
  '一': 1, '1': 1, '二': 2, '2': 2, '三': 3, '3': 3,
  '四': 4, '4': 4, '五': 5, '5': 5, '六': 6, '6': 6,
  '日': 7, '天': 7, '7': 7,
};

function extractDay(text: string): number {
  const m = text.match(/星期\s*([一二三四五六日天1-7])/);
  if (m) return DAY_MAP[m[1]] || 0;
  const m2 = text.match(/周([一二三四五六日天])(?!\d)/);
  if (m2) return DAY_MAP[m2[1]] || 0;
  return 0;
}

function extractPeriodsFromText(text: string): string {
  const m = text.match(/第?(\d+)\s*[-~]\s*(\d+)\s*节/);
  if (m) return `${m[1]}-${m[2]}`;
  // "1-2"（无"节"字，且后面不是"周"）
  const m2 = text.match(/第?(\d+)\s*[-~]\s*(\d+)(?!\s*周)/);
  if (m2) return `${m2[1]}-${m2[2]}`;
  // 四位数字 "0102" = 第1-2节
  const m4 = text.match(/\b0(\d)0(\d)\b/);
  if (m4) {
    const a = parseInt(m4[1], 10), b = parseInt(m4[2], 10);
    if (b > a && b <= 9) return `${a}-${b}`;
  }
  return '';
}

export function parseTdStrategy(html: string): ParsedCourse[] {
  // 优先锁定课表容器（老版正方特征类名），找不到才全页扫
  let container = html;
  const containerMatch = html.match(/<[^>]*class="[^"]*report_tSxsgrkbcx[^"]*"[^>]*>[\s\S]*?<\/table>/i)
    || html.match(/<[^>]*id="[^"]*(kbtable|kbTable|timetable)[^"]*"[^>]*>[\s\S]*?<\/table>/i);
  if (containerMatch) container = containerMatch[0];

  const courses: ParsedCourse[] = [];
  const tdRegex = /<t[d][^>]*>([\s\S]*?)<\/t[d]>/gi;
  let tdMatch: RegExpExecArray | null;

  while ((tdMatch = tdRegex.exec(container)) !== null) {
    const cell = tdMatch[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cell || cell.length < 2) continue;
    if (/^(上午|下午|晚上|中午|第\d+节)$/.test(cell)) continue;
    if (!isPlausibleCourse(cell)) continue;

    const name = extractName(cell);
    const day = extractDay(cell);
    const periods = extractPeriodsFromText(cell);
    if (!name || name.length < 2 || !day || !periods) continue;

    courses.push({
      name,
      teacher: extractTeacher(cell),
      location: extractLocation(cell),
      dayOfWeek: day,
      periods,
      weeks: extractWeeks(cell),
    });
  }

  return courses;
}
