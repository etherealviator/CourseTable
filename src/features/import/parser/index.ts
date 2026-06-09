import { ParsedCourse } from '../../../shared/types';
import { parseGridStrategy } from './strategies/grid';
import { parseTableStrategy } from './strategies/table';
import { parseDivStrategy } from './strategies/div';
import { cleanAndDeduplicate } from './pipeline';

export type ParseStrategy = (html: string) => ParsedCourse[];

const strategies: ParseStrategy[] = [
  // 1. jqGrid JSON 格式 (最优, 结构化)
  parseGridStrategy,
  // 2. 标准 HTML table (正方/青果等主流教务系统)
  parseTableStrategy,
  // 3. Div 布局 (极少数学校)
  parseDivStrategy,
];

export function parseCourseTable(html: string): ParsedCourse[] {
  for (const strategy of strategies) {
    const result = strategy(html);
    if (result.length > 0) return cleanAndDeduplicate(result);
  }
  return [];
}

export function parseGridData(data: unknown[]): ParsedCourse[] {
  const result = parseGridStrategy(JSON.stringify(data));
  return cleanAndDeduplicate(result);
}
