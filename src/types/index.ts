// 课程数据类型定义

export interface Course {
  id: string;
  name: string;          // 课程名
  teacher: string;       // 任课教师
  location: string;      // 上课地点
  dayOfWeek: number;     // 星期几 (1-7, 1=周一)
  startPeriod: number;   // 开始节次 (1-12)
  endPeriod: number;     // 结束节次 (1-12)
  weeks: number[];       // 上课周次 [1,2,3,...]
  color: string;         // 课程颜色
  isBiweekly?: 'odd' | 'even' | null; // 单双周
}

export interface ParsedCourse {
  name: string;
  teacher: string;
  location: string;
  dayOfWeek: number;
  periods: string; // 如 "1-2", "3-4"
  weeks: string;   // 如 "1-18", "1-16(单)"
}

// 教务系统模板类型
export type EduSystemType = 'zhengfang' | 'qingguo' | 'urp' | 'custom';

export interface EduSystemTemplate {
  name: string;
  type: EduSystemType;
  loginUrl: string;
  scheduleUrl: string;
  tableSelector: string;  // CSS选择器定位课程表
}
