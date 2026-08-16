import { ParsedCourse } from '../../../shared/types';
import { parseJsonStrategy } from './strategies/json';
import { parseGridStrategy } from './strategies/grid';
import { parseTableStrategy } from './strategies/table';
import { parseTdStrategy } from './strategies/td';
import { cleanAndDeduplicate } from './pipeline';

export type ParseStrategy = (html: string) => ParsedCourse[];

const strategies: ParseStrategy[] = [
  // 1. 内嵌 JSON 数组（老版正方 jqGrid 数据源，最精准）
  parseJsonStrategy,
  // 2. jqGrid JSON
  parseGridStrategy,
  // 3. 标准 HTML table
  parseTableStrategy,
  // 4. 老版正方 td 内容解析（每格自带星期/节次，不依赖表头）
  parseTdStrategy,
];

export function parseCourseTable(html: string): ParsedCourse[] {
  for (const s of strategies) {
    const r = s(html);
    if (r.length > 0) return cleanAndDeduplicate(r);
  }
  return [];
}

export function parseGridData(data: unknown[]): ParsedCourse[] {
  const result = parseGridStrategy(JSON.stringify(data));
  return cleanAndDeduplicate(result);
}
