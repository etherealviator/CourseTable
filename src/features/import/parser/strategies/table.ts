import { ParsedCourse } from '../../../../shared/types';
import { extractName, extractTeacher, extractLocation, extractWeeks, isPlausibleCourse } from '../extractors';

/**
 * 解析正方/青果/URP 教务系统课表 HTML table
 */
export function parseTableStrategy(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const rows = extractRows(tableMatch[1]);
    if (rows.length < 3) continue;

    const allText = rows.flat().join(' ');

    // 快速判断: 必须包含课程相关关键词
    if (!/课程|课名|kcmc|教师|老师|jsxm|教室|jsmc|星期|周[一二三四五六日天]|节次|第\d+节|上课周|1-2节/i.test(allText)) {
      continue;
    }

    // 找表头行
    let headerIdx = -1;
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      if (/星期|周[一二三四五六日天]|节次|时间|周一|周二|Wed|Mon|Tue/i.test(rows[i].join(' '))) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) continue;

    const headerCells = rows[headerIdx];
    const dayStartIdx = headerCells.length > 0 && /节次|时间/.test(headerCells[0]) ? 1 : 0;
    const dayCount = Math.min(headerCells.length - dayStartIdx, 7);

    for (let rowIdx = headerIdx + 1; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length <= dayStartIdx) continue;

      // 提取行级节次
      const periodInfo = row[0] || '';
      let rowPeriods = '';
      const pm = periodInfo.match(/(\d+)\s*[-~]\s*(\d+)/);
      if (pm) rowPeriods = `${pm[1]}-${pm[2]}`;

      for (let col = 0; col < dayCount; col++) {
        const colIdx = dayStartIdx + col;
        if (colIdx >= row.length) continue;

        const cell = row[colIdx]?.trim();
        if (!cell || cell === '&nbsp;' || cell === '') continue;

        // === 关键过滤: 只有真正的课程才解析 ===
        if (!isPlausibleCourse(cell)) continue;

        const name = extractName(cell);
        if (!name || name.length < 2) continue;

        const dayOfWeek = col + 1;

        // 节次: 先用行级, 如果行级没有从单元格提取
        let periods = rowPeriods;
        if (!periods) {
          const cp = cell.match(/(\d+)\s*[-~]\s*(\d+)\s*节/);
          if (cp) periods = `${cp[1]}-${cp[2]}`;
        }

        const teacher = extractTeacher(cell);
        const location = extractLocation(cell);
        const weeks = extractWeeks(cell);

        courses.push({ name, teacher, location, dayOfWeek, periods, weeks });
      }
    }
  }

  return courses;
}

function extractRows(tableHtml: string): string[][] {
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[][] = [];
  let m: RegExpExecArray | null;

  while ((m = rowRegex.exec(tableHtml)) !== null) {
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cm: RegExpExecArray | null;
    while ((cm = cellRegex.exec(m[1])) !== null) {
      const content = cm[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(content);
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}
