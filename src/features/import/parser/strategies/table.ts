import { ParsedCourse } from '../../../../shared/types';
import { extractName, extractTeacher, extractLocation, extractPeriods, extractWeeks } from '../extractors';

export function parseTableStrategy(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const rows = extractRows(tableMatch[1]);
    if (rows.length < 2) continue;

    const allText = rows.flat().join(' ');
    if (!/课程|教师|教室|星期|周[一二三四五六日]|周一|第\d+节|\d+[-~]\d+周/.test(allText) && rows.length < 4) continue;

    let headerIdx = 0;
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      if (/星期|周[一二三四五六日]|节次|时间|周一|Tue|Mon/i.test(rows[i].join(' '))) {
        headerIdx = i;
        break;
      }
    }

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      if (rowIdx === headerIdx) continue;
      const row = rows[rowIdx];
      const periods = extractPeriods(row[0] || '');

      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = row[colIdx].trim();
        if (!cell || cell === '&nbsp;') continue;
        if (/^[\s\d]+$/.test(cell) || /^第?\d+[-~]?\d*[节\s]*$/.test(cell)) continue;

        const day = colIdx === 0 ? 1 : Math.min(colIdx, 7);
        const name = extractName(cell);
        if (!name || name.length < 2) continue;

        courses.push({
          name,
          teacher: extractTeacher(cell),
          location: extractLocation(cell),
          dayOfWeek: day,
          periods,
          weeks: extractWeeks(cell),
        });
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
      cells.push(cm[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' '));
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}
