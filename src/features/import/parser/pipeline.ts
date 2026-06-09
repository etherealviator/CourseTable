import { ParsedCourse } from '../../../shared/types';
import { isPlausibleCourse } from './extractors';

export function cleanAndDeduplicate(courses: ParsedCourse[]): ParsedCourse[] {
  const seen = new Set<string>();
  return courses
    .filter(c => {
      // 去重
      const key = `${c.name}|${c.dayOfWeek}|${c.periods}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter(c => {
      // 二次过滤: 确保是真正的课程
      if (!c.name || c.name.length < 2) return false;
      if (/^(上午|下午|晚上|中午|第\d+节|\d+:\d+|\d+[-~]\d+节?)$/.test(c.name)) return false;
      if (/^\d+$/.test(c.name)) return false;
      if (/^教学班组成/.test(c.name)) return false;
      if (/^周[一二三四五六日天]$/.test(c.name)) return false;
      if (/^星期一$|^星期二$|^星期三$|^星期四$|^星期五$|^星期六$|^星期日$/.test(c.name)) return false;
      // 班级名模式: 管2304-1
      if (/^[\u4e00-\u9fff]\d{3,}[-]\d+$/.test(c.name)) return false;
      return true;
    });
}
