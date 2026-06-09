import { ParsedCourse } from '../../../shared/types';

export function cleanAndDeduplicate(courses: ParsedCourse[]): ParsedCourse[] {
  const seen = new Set<string>();
  return courses
    .filter(c => {
      const key = `${c.name}|${c.dayOfWeek}|${c.periods}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter(c => {
      const name = c.name.trim();
      if (name.length < 2) return false;
      if (/^(上午|下午|晚上|中午|第\d+节|\d+:\d+|\d+[-~]\d+节?)$/.test(name)) return false;
      if (/^\d+$/.test(name)) return false;
      return true;
    });
}
