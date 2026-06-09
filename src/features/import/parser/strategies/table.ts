import { ParsedCourse } from '../../../../shared/types';
import { extractName, extractTeacher, extractLocation, extractWeeks } from '../extractors';

/**
 * 解析正方/青果/URP等教务系统的课表 HTML table
 *
 * 标准课表结构:
 *   <tr><th>节次/时间</th><th>周一</th><th>周二</th>...<th>周日</th></tr>
 *   <tr>
 *     <td>1-2节<br>08:00-09:40</td>
 *     <td>
 *       高等数学A<br>          ← 课程名
 *       张三<br>              ← 教师
 *       教1-201<br>           ← 教室
 *       1-16周                ← 周次
 *     </td>
 *     <td>...</td>
 *     ...
 *   </tr>
 *
 * 注意: 一个格子可能包含多门课(合班上课)，用 <br> 分隔
 */
export function parseTableStrategy(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    const rows = extractRows(tableHtml);

    // 课表至少3行(表头+2行数据)
    if (rows.length < 3) continue;

    const allText = rows.flat().join(' ');

    // 快速判断是不是课表: 必须包含课程相关关键词
    if (!/课程|课名|kcmc|教师|老师|jsxm|教室|jsmc|星期|周[一二三四五六日天]|节次|第\d+节|上课周|zcd/i.test(allText)) {
      continue;
    }

    // 找表头行 (包含"星期/周一/节次"等字样的行)
    let headerIdx = -1;
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      const rowText = rows[i].join(' ');
      if (/星期|周[一二三四五六日天]|节次|时间|周一|周二|Wed|Mon|Tue/i.test(rowText)) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) continue;

    // 确定有多少天列 (从表头行统计)
    const headerCells = rows[headerIdx];
    let dayStartIdx = 1; // 默认第1列开始是周一

    // 第0列可能是"节次"或"时间"或空
    if (headerCells.length > 0 && /节次|时间|^$/.test(headerCells[0])) {
      dayStartIdx = 1;
    } else {
      dayStartIdx = 0;
    }

    // 计算天数
    const dayCount = Math.min(headerCells.length - dayStartIdx, 7);

    // 遍历数据行
    for (let rowIdx = headerIdx + 1; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length <= dayStartIdx) continue;

      // 尝试从第0列提取节次信息, 如 "1-2节"、"第1-2节"、"1-2"
      const periodInfo = row[0] || '';
      let rowPeriods = '';
      const pm = periodInfo.match(/(\d+)\s*[-~]\s*(\d+)/);
      if (pm) rowPeriods = `${pm[1]}-${pm[2]}`;

      // 遍历每一天的列
      for (let col = 0; col < dayCount; col++) {
        const colIdx = dayStartIdx + col;
        if (colIdx >= row.length) continue;

        const cell = row[colIdx]?.trim();
        if (!cell || cell === '&nbsp;' || cell === '') continue;

        // 过滤明显不是课程内容的
        if (/^(上午|下午|晚上|中午|第\d+节|\d+:\d+|\d+[-~]\d+节?)$/.test(cell)) continue;
        if (/^\d+$/.test(cell)) continue;
        if (/^(登录|注册|密码|验证码|用户名)$/i.test(cell)) continue;

        const dayOfWeek = col + 1; // col 0 = 周一(1), col 1 = 周二(2) ...

        // 一个格子可能有多门课 (用 <br> 分隔)
        // 也可能包含所有信息: 课程名\n教师\n教室\n周次
        const lines = cell.split('\n').filter(s => s.trim());

        // 尝试合并或拆分
        const name = extractName(cell);
        if (!name || name.length < 2) continue;

        // 每个课程提取节次
        let periods = rowPeriods;
        if (!periods) {
          // 从格子内容中提取 "1-2节"
          const cp = cell.match(/(\d+)\s*[-~]\s*(\d+)\s*节/);
          if (cp) periods = `${cp[1]}-${cp[2]}`;
        }

        const teacher = extractTeacher(cell);
        const location = extractLocation(cell);
        const weeks = extractWeeks(cell);

        courses.push({ name, teacher, location, dayOfWeek, periods, weeks });

        // 如果格子包含多个课程行, 尝试提取更多
        if (lines.length >= 4) {
          // 可能包含第二门课
          for (let li = 3; li < lines.length; li += 3) {
            const name2 = extractName(lines[li] || '');
            if (name2 && name2.length >= 2 && name2 !== name) {
              courses.push({
                name: name2,
                teacher: extractTeacher(lines[li + 1] || ''),
                location: extractLocation(lines[li + 2] || ''),
                dayOfWeek,
                periods,
                weeks: extractWeeks(lines[li + 2] || ''),
              });
            }
          }
        }
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
        .replace(/<br\s*\/?>/gi, '\n')  // 保留<br>作为换行符
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
