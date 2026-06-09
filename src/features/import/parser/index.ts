import { ParsedCourse } from '../../../shared/types';
import { parseGridStrategy } from './strategies/grid';
import { cleanAndDeduplicate } from './pipeline';

export type ParseStrategy = (html: string) => ParsedCourse[];

export function parseCourseTable(html: string): ParsedCourse[] {
  // 尝试 jqGrid JSON 格式
  const gridResult = parseGridStrategy(html);
  if (gridResult.length > 0) return cleanAndDeduplicate(gridResult);
  return [];
}

export function parseGridData(data: unknown[]): ParsedCourse[] {
  const result = parseGridStrategy(JSON.stringify(data));
  return cleanAndDeduplicate(result);
}
