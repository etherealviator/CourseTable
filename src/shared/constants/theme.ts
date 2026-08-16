import { ThemeMode } from '../types';

export const COURSE_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6',
];

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export interface ThemePreset {
  mode: string;
  label: string;
  bg: string;        // 页面背景
  headerBg: string;  // 顶部栏背景
  headerText: string; // 顶部栏文字（标题用）
  text: string;      // 正文
  sub: string;       // 次要文字
  accent: string;    // 强调色
}

/** 主题预设：黑白 + 彩色整页纯色 */
export const THEME_PRESETS: Record<string, ThemePreset> = {
  light: { mode: 'light', label: '白', bg: '#ffffff', headerBg: '#ffffff', headerText: '#333333', text: '#333333', sub: '#999999', accent: '#4A90D9' },
  dark: { mode: 'dark', label: '黑', bg: '#1C1C1E', headerBg: '#1C1C1E', headerText: '#eeeeee', text: '#eeeeee', sub: '#888888', accent: '#4A90D9' },
  blue: { mode: 'blue', label: '蓝', bg: '#EAF2FB', headerBg: '#4A90D9', headerText: '#ffffff', text: '#1a2a3a', sub: '#5a7a9a', accent: '#4A90D9' },
  green: { mode: 'green', label: '绿', bg: '#E6F4EA', headerBg: '#10B981', headerText: '#ffffff', text: '#1a2a22', sub: '#5a8a6a', accent: '#10B981' },
  orange: { mode: 'orange', label: '橙', bg: '#FEF3E2', headerBg: '#F59E0B', headerText: '#ffffff', text: '#3a2a12', sub: '#9a7a4a', accent: '#F59E0B' },
  purple: { mode: 'purple', label: '紫', bg: '#F0EAFC', headerBg: '#8B5CF6', headerText: '#ffffff', text: '#2a1a3a', sub: '#7a5a9a', accent: '#8B5CF6' },
  pink: { mode: 'pink', label: '粉', bg: '#FCE7F3', headerBg: '#EC4899', headerText: '#ffffff', text: '#3a1a2a', sub: '#9a5a7a', accent: '#EC4899' },
  red: { mode: 'red', label: '红', bg: '#FDE8E8', headerBg: '#EF4444', headerText: '#ffffff', text: '#3a1a1a', sub: '#9a5a5a', accent: '#EF4444' },
};

export const THEME_PRESET_ORDER: ThemeMode[] = ['light', 'dark', 'blue', 'green', 'orange', 'purple', 'pink', 'red'];

/** 取主题预设（未知模式回退浅色） */
export function getThemePreset(mode?: string): ThemePreset {
  return THEME_PRESETS[mode || 'light'] || THEME_PRESETS.light;
}
