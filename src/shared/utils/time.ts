export function getCurrentWeek(semesterStart: string): number {
  const start = new Date(semesterStart);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(20, Math.floor(diffDays / 7) + 1));
}

/** 学期是否已开始（今天 >= 开学日） */
export function isSemesterStarted(semesterStart: string): boolean {
  const start = new Date(semesterStart);
  const now = new Date();
  return now.getTime() >= start.getTime();
}

/** 今天日期标签：8月16日 */
export function getTodayDateLabel(): string {
  const now = new Date();
  return `${now.getMonth() + 1}月${now.getDate()}日`;
}

/** 开学日标签：2026年9月1日 */
export function getStartDateLabel(semesterStart: string): string {
  const d = new Date(semesterStart);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 取日期所在周的周一 */
function getMonday(d: Date): Date {
  const day = d.getDay(); // 0=周日
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(d.getTime() + diff * 86400000);
}

/** 第 week 周各天的号数（1-31），从周一排到周日，跨月自动进位 */
export function getWeekDayDates(semesterStart: string, week: number): number[] {
  const start = new Date(semesterStart);
  if (isNaN(start.getTime())) return [];
  const monday = getMonday(start);
  const weekStart = new Date(monday.getTime() + (week - 1) * 7 * 86400000);
  const dates: number[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(weekStart.getTime() + i * 86400000).getDate());
  }
  return dates;
}

export function getTodayDayOfWeek(): number {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

export function getDefaultSemesterStart(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  // 暑假(8月)：指向下学期(新学年9月开学)
  if (m === 8) return `${y}-09-01`;
  return m >= 9 || m <= 2 ? `${m >= 9 ? y : y - 1}-09-01` : `${y}-03-01`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function isCourseActive(weeks: number[], currentWeek: number): boolean {
  return weeks.includes(currentWeek);
}

export const PERIOD_TIMES: [string, string][] = [
  ['08:00', '08:45'], ['08:55', '09:40'], ['10:00', '10:45'],
  ['10:55', '11:40'], ['14:00', '14:45'], ['14:55', '15:40'],
  ['15:50', '16:35'], ['16:45', '17:30'], ['19:00', '19:45'],
  ['19:55', '20:40'], ['20:50', '21:35'], ['21:45', '22:30'],
];

// 从设置中的 periodTimes 字符串数组解析成 [start, end] 格式
export function parsePeriodTimes(arr?: string[]): [string, string][] {
  if (!arr || arr.length === 0) return PERIOD_TIMES;
  return arr.map(s => {
    const parts = s.split('-');
    if (parts.length === 2) return [parts[0].trim(), parts[1].trim()] as [string, string];
    return ['??:??', '??:??'];
  });
}

export const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
