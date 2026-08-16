import { ParsedCourse } from '../../../shared/types';
import { parseGridStrategy } from './strategies/grid';
import { parseTableStrategy } from './strategies/table';
import { parseTdStrategy } from './strategies/td';
import { cleanAndDeduplicate } from './pipeline';

export type ParseStrategy = (html: string) => ParsedCourse[];

const strategies: ParseStrategy[] = [
  // 1. jqGrid JSON
  parseGridStrategy,
  // 2. 标准 HTML table
  parseTableStrategy,
  // 3. 老版正方 td 内容解析（每格自带星期/节次，不依赖表头）
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
