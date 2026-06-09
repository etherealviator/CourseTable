/**
 * 解析 jqGrid 行数据 — 正方教务系统常用格式
 *
 * 典型 jqGrid 返回:
 * [
 *   { kcmc: "高等数学A", jsxm: "张三", jsmc: "教1-201", xqj: "1", jcor: "1-2", zcd: "1-16周" },
 *   { kcmc: "大学英语", jsxm: "李四", jsmc: "教2-301", xqj: "3", jcor: "3-4", zcd: "1-16周" },
 *   ...
 * ]
 */
export function parseGridStrategy(input: string): ParsedCourse[] {
  let data: unknown[];
  try { data = JSON.parse(input); } catch { return []; }
  if (!Array.isArray(data) || data.length === 0) return [];

  const courses: ParsedCourse[] = [];
  const firstRow = data[0];

  if (Array.isArray(firstRow)) {
    // 2D 数组格式: 每一行=[节次, 周一课程, 周二课程, ...]
    return parse2DArray(data as unknown[][]);
  }

  if (typeof firstRow === 'object' && firstRow !== null) {
    // jqGrid 对象数组格式
    const rows = data as Record<string, unknown>[];

    // 尝试检测字段名 (兼容中文和英文)
    const fields = detectFields(Object.keys(rows[0]));
    if (!fields.name) return [];

    for (const row of rows) {
      const name = safeStr(row[fields.name]);
      if (!name || name === 'undefined' || name === 'null' || name.length < 2) continue;

      // 过滤掉学生信息行 (学号/班级等)
      if (/^\d{8,}$/.test(name)) continue;
      if (/^(学号|姓名|班级|专业|学院)$/i.test(name)) continue;

      courses.push({
        name,
        teacher: safeStr(row[fields.teacher]),
        location: safeStr(row[fields.location]),
        dayOfWeek: parseDay(safeStr(row[fields.day])),
        periods: parsePeriods(safeStr(row[fields.periods])),
        weeks: safeStr(row[fields.weeks]),
      });
    }
  }

  return courses;
}

// −−− 辅助函数 −−−

interface FieldMap {
  name: string;
  teacher: string;
  location: string;
  day: string;
  periods: string;
  weeks: string;
}

function detectFields(keys: string[]): FieldMap {
  const def: FieldMap = { name: 'kcmc', teacher: 'jsxm', location: 'jsmc', day: 'xqj', periods: 'jcor', weeks: 'zcd' };

  const rules: [keyof FieldMap, RegExp[]][] = [
    ['name', [/^kcmc$/i, /^kcm$/i, /^课程名/, /^课名/, /courseName/i, /^name$/i]],
    ['teacher', [/^jsxm$/i, /^jszc$/i, /^teacher$/i, /^教师$/, /^任课/]],
    ['location', [/^jsmc$/i, /^jsdd$/i, /^cdmc$/i, /^classroom$/i, /^教室$/, /^地点$/]],
    ['day', [/^xqj$/i, /^skxq$/i, /^dayOfWeek$/i, /^weekDay$/i, /^星期/]],
    ['periods', [/^jcor$/i, /^jc$/i, /^skjc$/i, /^periods$/i, /^节次$/, /^sessions$/i]],
    ['weeks', [/^zcd$/i, /^zc$/i, /^weeks$/i, /^周次$/, /^weekDescription$/i]],
  ];

  for (const [field, patterns] of rules) {
    for (const key of keys) {
      if (patterns.some(p => p.test(key))) {
        (def as any)[field] = key;
        break;
      }
    }
  }

  return def;
}

function parse2DArray(rows: unknown[][]): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  if (rows.length < 2) return [];

  const headerRow = rows[0] as string[];
  const hasHeader = headerRow.some(c => /周[一二三四五六日]|星期|周一/i.test(String(c)));

  const startRow = hasHeader ? 1 : 0;
  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r] as string[];
    if (!Array.isArray(row) || row.length < 2) continue;

    const periodText = String(row[0] || '');
    const periods = parsePeriods(periodText);

    for (let c = 1; c < row.length && c <= 7; c++) {
      const cell = String(row[c] || '').trim();
      if (!cell || cell === '&nbsp;' || cell.length < 2) continue;
      if (/^(上午|下午|晚上|中午|第\d+节)/.test(cell)) continue;

      const name = extractNameSimple(cell);
      if (!name || name.length < 2) continue;

      courses.push({
        name,
        teacher: '',
        location: '',
        dayOfWeek: c,
        periods,
        weeks: '',
      });
    }
  }
  return courses;
}

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function parseDay(s: string): number {
  const map: Record<string, number> = {
    '一':1,'1':1,'周一':1,'二':2,'2':2,'周二':2,'三':3,'3':3,'周三':3,
    '四':4,'4':4,'周四':4,'五':5,'5':5,'周五':5,'六':6,'6':6,'周六':6,
    '日':7,'7':7,'天':7,'周日':7,
  };
  for (const [k, v] of Object.entries(map)) {
    if (s.includes(k)) return v;
  }
  const n = parseInt(s);
  return n >= 1 && n <= 7 ? n : 1;
}

function parsePeriods(s: string): string {
  const m = s.match(/(\d+)\s*[-~]\s*(\d+)/);
  return m ? `${m[1]}-${m[2]}` : '';
}

function extractNameSimple(s: string): string {
  const m = s.match(/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z]{2,}/);
  return m ? m[0] : '';
}
