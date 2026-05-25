// 时间工具函数

/**
 * 获取当前是第几教学周
 * @param semesterStart 学期开始日期 (YYYY-MM-DD)
 * @returns 当前周数 (从1开始)
 */
export function getCurrentWeek(semesterStart: string): number {
  const start = new Date(semesterStart);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(20, week)); // 限制在 1-20 周
}

/**
 * 获取今天是星期几 (1=周一, 7=周日)
 */
export function getTodayDayOfWeek(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

/**
 * 格式化日期为月日
 */
export function formatDate(date: Date = new Date()): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 获取当前学期开始日期 (默认9月1日或3月1日)
 */
export function getDefaultSemesterStart(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // 9月-2月视为秋季学期，3月-8月视为春季学期
  if (month >= 9 || month <= 2) {
    return `${month >= 9 ? year : year - 1}-09-01`;
  } else {
    return `${year}-03-01`;
  }
}

/**
 * 判断课程是否在当前周上课
 */
export function isCourseThisWeek(courseWeeks: number[], currentWeek: number): boolean {
  return courseWeeks.includes(currentWeek);
}

/**
 * 获取整学期周数列表
 */
export function getAllWeeks(count: number = 20): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
