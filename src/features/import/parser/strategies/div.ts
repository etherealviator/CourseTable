import { ParsedCourse } from '../../../../shared/types';
import { extractName, extractTeacher, extractLocation, extractWeeks } from '../extractors';

export function parseDivStrategy(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const blockRegex = /<div[^>]*class="[^"]*(?:course|kecheng|class-item|schedule)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let m: RegExpExecArray | null;

  while ((m = blockRegex.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (text.length < 3) continue;
    const name = extractName(text);
    if (!name || name.length < 2) continue;
    courses.push({
      name,
      teacher: extractTeacher(text),
      location: extractLocation(text),
      dayOfWeek: 1,
      periods: '',
      weeks: extractWeeks(text),
    });
  }
  return courses;
}
