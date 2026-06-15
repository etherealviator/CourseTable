import { ParsedCourse } from '../../../shared/types';
import { parseGridStrategy } from './strategies/grid';
import { parseTableStrategy } from './strategies/table';
import { cleanAndDeduplicate } from './pipeline';

export type ParseStrategy = (html: string) => ParsedCourse[];

const strategies: ParseStrategy[] = [
  // 1. jqGrid JSON
  parseGridStrategy,
  // 2. 标准 HTML table
  parseTableStrategy,
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
