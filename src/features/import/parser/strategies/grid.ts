import { ParsedCourse } from '../../../../shared/types';
import { extractName, extractTeacher, extractLocation, extractPeriods, extractWeeks } from '../extractors';

export function parseGridStrategy(input: string): ParsedCourse[] {
  let data: unknown[];
  try { data = JSON.parse(input); } catch { return []; }
  if (!Array.isArray(data) || data.length === 0) return [];

  const courses: ParsedCourse[] = [];
  const firstRow = data[0];

  if (Array.isArray(firstRow)) {
    // 2D timetable: rows = periods, cols = days
    const rows = data as unknown[][];
    const headerRow = rows[0] as string[];
    const hasHeader = headerRow && headerRow.some((c: string) =>
      /周[一二三四五六日]|星期|周一|周二|周三|周四|周五|周六|周日/i.test(String(c))
    );
    const startRow = hasHeader ? 1 : 0;

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r] as string[];
      if (!Array.isArray(row)) continue;
      const periods = extractPeriods(String(row[0] || ''));

      for (let c = 1; c < row.length && c <= 7; c++) {
        const cell = String(row[c] || '').trim();
        if (!cell || cell === '&nbsp;') continue;
        const name = extractName(cell);
        if (!name || name.length < 2) continue;
        courses.push({
          name,
          teacher: extractTeacher(cell),
          location: extractLocation(cell),
          dayOfWeek: c,
          periods,
          weeks: extractWeeks(cell),
        });
      }
    }
  } else if (typeof firstRow === 'object' && firstRow !== null) {
    // jqGrid row data
    const rows = data as Record<string, unknown>[];
    for (const row of rows) {
      const name = String(row.kcm || row.kc || row.kcmc || row.courseName || row['课程名'] || row['课程名称'] || '');
      if (!name || name === 'undefined' || name === 'null') continue;

      const xh = String(row.xh || row['学号'] || '');
      const bj = String(row.bj || row.bjmc || row['班级'] || '');
      if ((xh || bj) && !name) continue;

      courses.push({
        name,
        teacher: String(row.jsxm || row.jszc || row.teacher || row['教师'] || ''),
        location: String(row.jsmc || row.jsdd || row.classroom || row['教室'] || ''),
        dayOfWeek: parseDay(String(row.xqj || row.skxq || row.day || row.weekDay || row['星期'] || '1')),
        periods: String(row.jcor || row.jc || row.periods || row.sessions || row['节次'] || ''),
        weeks: String(row.zc || row.weeks || row.weekDescription || row['周次'] || ''),
      });
    }
  }

  return courses;
}

function parseDay(s: string): number {
  const map: Record<string, number> = {
    '一':1,'1':1,'二':2,'2':2,'三':3,'3':3,'四':4,'4':4,
    '五':5,'5':5,'六':6,'6':6,'日':7,'7':7,'天':7,
  };
  for (const [k, v] of Object.entries(map)) { if (s.includes(k)) return v; }
  const n = parseInt(s);
  return n >= 1 && n <= 7 ? n : 1;
}
