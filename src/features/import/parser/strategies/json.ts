import { ParsedCourse } from '../../../../shared/types';

export function parseJsonStrategy(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const jsonRegex = /(?:var|let|const)\s+\w+\s*=\s*(\[[\s\S]*?\])\s*;?/g;
  let m: RegExpExecArray | null;

  while ((m = jsonRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      if (!Array.isArray(data)) continue;
      for (const item of data) {
        const name = String(item.kcm || item.courseName || item.name || item['课程名'] || '');
        if (!name || name === 'undefined') continue;
        courses.push({
          name,
          teacher: String(item.jsxm || item.teacher || item['教师'] || ''),
          location: String(item.jsmc || item.classroom || item['教室'] || ''),
          dayOfWeek: parseDay(String(item.xqj || item.day || item.weekDay || item['星期'] || '1')),
          periods: String(item.jcor || item.periods || item.sessions || item['节次'] || ''),
          weeks: String(item.zc || item.weeks || item.weekDescription || item['周次'] || ''),
        });
      }
    } catch { /* not valid JSON */ }
  }
  return courses;
}

function parseDay(s: string): number {
  const map: Record<string, number> = {
    '一':1,'1':1,'周一':1,'二':2,'2':2,'周二':2,'三':3,'3':3,'周三':3,
    '四':4,'4':4,'周四':4,'五':5,'5':5,'周五':5,'六':6,'6':6,'周六':6,
    '日':7,'7':7,'天':7,'周日':7,
  };
  for (const [k, v] of Object.entries(map)) { if (s.includes(k)) return v; }
  const n = parseInt(s);
  return n >= 1 && n <= 7 ? n : 1;
}
