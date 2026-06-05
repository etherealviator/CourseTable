export function getCurrentWeek(semesterStart: string): number {
  const start = new Date(semesterStart);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(20, Math.floor(diffDays / 7) + 1));
}

export function getTodayDayOfWeek(): number {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

export function getDefaultSemesterStart(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
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

export const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
