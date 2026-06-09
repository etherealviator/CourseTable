import { ParsedCourse } from '../../../shared/types';

export function cleanAndDeduplicate(courses: ParsedCourse[]): ParsedCourse[] {
  const seen = new Set<string>();
  return courses.filter(c => {
    if (!c.name || c.name.length < 2) return false;
    if (/^(上午|下午|晚上|中午|第\d+节)$/.test(c.name)) return false;
    const key = `${c.name}|${c.dayOfWeek}|${c.periods}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
