import { ParsedCourse } from '../../../shared/types';
import { parseTableStrategy } from './strategies/table';
import { parseDivStrategy } from './strategies/div';
import { parseJsonStrategy } from './strategies/json';
import { parseGridStrategy } from './strategies/grid';
import { cleanAndDeduplicate } from './pipeline';

export type ParseStrategy = (html: string) => ParsedCourse[];

const strategies: ParseStrategy[] = [
  parseTableStrategy,
  parseDivStrategy,
  parseJsonStrategy,
  parseGridStrategy,
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
