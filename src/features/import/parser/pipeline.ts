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
    .filter(c => c.name.length >= 2);
}
