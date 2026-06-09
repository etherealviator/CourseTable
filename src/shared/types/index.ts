export interface Course {
  id: string;
  name: string;
  teacher: string;
  location: string;
  dayOfWeek: number;   // 1-7, 1=周一
  startPeriod: number;  // 1-12
  endPeriod: number;
  weeks: number[];
  color: string;
  remark?: string;
}

export interface ParsedCourse {
  name: string;
  teacher: string;
  location: string;
  dayOfWeek: number;
  periods: string;  // "1-2"
  weeks: string;    // "1-18"
}

export interface PeriodTime {
  period: number;
  start: string;
  end: string;
}

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface AppSettings {
  semesterStart: string;
  totalWeeks: number;
  themeMode: ThemeMode;
  currentWeek: number;
  showWeekends: boolean;
  themeColor: string;
  periodTimes?: string[];   // ["08:00-08:45", "08:55-09:40", ...] 自定义时间段
}
