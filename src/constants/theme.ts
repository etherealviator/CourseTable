// 主题与颜色常量

// 16 种课程颜色（柔和、高区分度）
export const COURSE_COLORS = [
  '#4A90D9', // 蓝
  '#E8734A', // 橙
  '#50B86C', // 绿
  '#D94A8A', // 粉
  '#8B5CF6', // 紫
  '#F59E0B', // 琥珀
  '#06B6D4', // 青
  '#EF4444', // 红
  '#10B981', // 翠绿
  '#6366F1', // 靛蓝
  '#EC4899', // 玫红
  '#F97316', // 橘
  '#14B8A6', // 蓝绿
  '#8B5CF6', // 紫罗兰
  '#E11D48', // 玫瑰
  '#0EA5E9', // 天蓝
];

// 当前周课程颜色（正常饱和度），非本周课程会基于此降低不透明度
export const NON_CURRENT_WEEK_OPACITY = 0.35;

// 节次时间映射（标准 45 分钟一节课）
export const PERIOD_TIMES = [
  { period: 1,  start: '08:00', end: '08:45' },
  { period: 2,  start: '08:55', end: '09:40' },
  { period: 3,  start: '10:00', end: '10:45' },
  { period: 4,  start: '10:55', end: '11:40' },
  { period: 5,  start: '14:00', end: '14:45' },
  { period: 6,  start: '14:55', end: '15:40' },
  { period: 7,  start: '16:00', end: '16:45' },
  { period: 8,  start: '16:55', end: '17:40' },
  { period: 9,  start: '19:00', end: '19:45' },
  { period: 10, start: '19:55', end: '20:40' },
  { period: 11, start: '20:50', end: '21:35' },
  { period: 12, start: '21:45', end: '22:30' },
];

// 星期显示
export const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 浅色主题
export const LIGHT_THEME = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  primary: '#4A90D9',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  headerBg: '#FFFFFF',
  todayBg: '#E8F4FD',
  nonCurrentWeek: 'rgba(0,0,0,0.08)',
};

// 深色主题
export const DARK_THEME = {
  background: '#000000',
  surface: '#1C1C1E',
  primary: '#5DA0E8',
  text: '#FFFFFF',
  textSecondary: '#98989D',
  border: '#38383A',
  headerBg: '#1C1C1E',
  todayBg: '#1A2A3A',
  nonCurrentWeek: 'rgba(255,255,255,0.08)',
};
