import { ParsedCourse } from '../../../../shared/types';

/**
 * 从课表页 HTML 中提取内嵌 JSON 数组解析
 *
 * 老版正方课表页会把课表数据以 JS 变量形式内嵌（jqGrid 数据源），典型:
 *   var kbList = [{kcm:"高等数学", jsxm:"张三", jsmc:"教1-201", xqj:"1", jcor:"1-2", zc:"1-16周"}, ...];
 * 或
 *   window.gridData = [{kcmc:"...", xm:"...", cdmc:"...", xqj:"...", jcor:"...", zcd:"..."}, ...];
 *
 * 兼容 kcm/zc 与 kcmc/zcd 两套字段名。只接受含课程名字段的数组（天然过滤教室/场地等无关数据）。
 */
export function parseJsonStrategy(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  // 找所有数组字面量（含 var/let/const/window.xx = 前缀）
  const jsonRegex = /(?:var|let|const|window\.\w+\s*=|=\s*)\s*[\w$]*\s*=\s*(\[[\s\S]*?\])\s*;?/g;
  let m: RegExpExecArray | null;

  while ((m = jsonRegex.exec(html)) !== null) {
    let data: unknown[];
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    if (!Array.isArray(data) || data.length === 0) continue;

    const first = data[0];
    if (!first || typeof first !== 'object') continue;

    const parsed: ParsedCourse[] = [];
    for (const item of data as Record<string, unknown>[]) {
      const name = String(item.kcmc || item.kcm || item.kc || item.name || item['课程名'] || '');
      if (!name || name === 'undefined' || name.length < 2) continue;
      parsed.push({
        name,
        teacher: String(item.xm || item.jsxm || item.teacher || item['教师'] || ''),
        location: String(item.cdmc || item.jsmc || item.classroom || item['教室'] || ''),
        dayOfWeek: parseDay(String(item.xqj || item.skxq || item.day || item['星期'] || '1')),
        periods: String(item.jcor || item.jcs || item.jc || item.periods || item['节次'] || ''),
        weeks: String(item.zcd || item.zc || item.weeks || item['周次'] || ''),
      });
    }
    if (parsed.length > 0) return parsed;
  }

  return courses;
}

function parseDay(s: string): number {
  const map: Record<string, number> = {
    '一': 1, '1': 1, '周一': 1, '二': 2, '2': 2, '周二': 2, '三': 3, '3': 3, '周三': 3,
    '四': 4, '4': 4, '周四': 4, '五': 5, '5': 5, '周五': 5, '六': 6, '6': 6, '周六': 6,
    '日': 7, '7': 7, '天': 7, '周日': 7,
  };
  for (const [k, v] of Object.entries(map)) {
    if (s.includes(k)) return v;
  }
  const n = parseInt(s, 10);
  return n >= 1 && n <= 7 ? n : 1;
}
