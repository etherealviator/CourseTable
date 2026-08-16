import { ParsedCourse } from '../../../../shared/types';
import { extractName, extractTeacher, extractLocation, extractWeeks, isPlausibleCourse } from '../extractors';

/**
 * 解析正方/青果/URP 教务系统课表 HTML table
 * 支持 rowspan/colspan 展开（老版正方"时间段"列 rowspan 合并）
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

    // 定位第一个星期列 —— 兼容 "时间段/节次/星期一..." 前缀列结构
    let dayStartIdx = -1;
    for (let i = 0; i < headerCells.length; i++) {
      if (/星期|周[一二三四五六日天]/.test(headerCells[i])) {
        dayStartIdx = i;
        break;
      }
    }
    if (dayStartIdx === -1) {
      // fallback: 无星期表头文本, 假设首列是节次
      dayStartIdx = headerCells.length > 0 && /节次|时间/.test(headerCells[0]) ? 1 : 0;
    }
    const dayCount = Math.min(headerCells.length - dayStartIdx, 7);
    if (dayCount < 5) continue;

    for (let rowIdx = headerIdx + 1; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length <= dayStartIdx) continue;

      // 行级节次（节次列在星期列之前）
      const periodInfo = row[dayStartIdx - 1] || '';
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

        // 节次: 先单元格内 "(1-2节)"，再行级，再无"节"字的 "1-2"
        let periods = '';
        const cp = cell.match(/(\d+)\s*[-~]\s*(\d+)\s*节/);
        if (cp) periods = `${cp[1]}-${cp[2]}`;
        if (!periods) periods = rowPeriods;
        if (!periods) {
          const cp2 = cell.match(/第?(\d+)\s*[-~]\s*(\d+)(?!\s*周)/);
          if (cp2) periods = `${cp2[1]}-${cp2[2]}`;
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

/** 展开 rowspan/colspan 后的逻辑行矩阵 */
function extractRows(tableHtml: string): string[][] {
  const rows: string[][] = [];
  const rowspanLeft: number[] = [];   // 每列剩余被占行数
  const rowspanVal: string[] = [];    // 被占列的值
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;

  while ((m = rowRegex.exec(tableHtml)) !== null) {
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cm: RegExpExecArray | null;
    let col = 0;

    // 先填充上行 rowspan 未结束的列
    while (rowspanLeft[col] > 0) {
      cells.push(rowspanVal[col]);
      rowspanLeft[col]--;
      col++;
    }

    while ((cm = cellRegex.exec(m[1])) !== null) {
      // 跳过被 rowspan 占据的列
      while (rowspanLeft[col] > 0) {
        cells.push(rowspanVal[col]);
        rowspanLeft[col]--;
        col++;
      }

      const tag = cm[0];
      const rs = (tag.match(/rowspan\s*=\s*["']?(\d+)/i) || [null, '1'])[1];
      const cs = (tag.match(/colspan\s*=\s*["']?(\d+)/i) || [null, '1'])[1];
      const rowSpan = parseInt(rs, 10) || 1;
      const colSpan = parseInt(cs, 10) || 1;

      const content = cm[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      for (let i = 0; i < colSpan; i++) {
        if (rowSpan > 1) {
          rowspanLeft[col] = rowSpan - 1;
          rowspanVal[col] = content;
        }
        cells.push(content);
        col++;
      }
    }

    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}
