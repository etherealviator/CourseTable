// AsyncStorage 封装 - 课程数据持久化

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course } from '../types';

const COURSES_KEY = '@courses';
const SETTINGS_KEY = '@settings';

export interface AppSettings {
  semesterStart: string;    // 学期开始日期
  totalWeeks: number;       // 总周数
  darkMode: 'auto' | 'light' | 'dark';
  currentWeek: number;      // 手动设置的当前周（覆盖自动计算）
}

const DEFAULT_SETTINGS: AppSettings = {
  semesterStart: '',
  totalWeeks: 20,
  darkMode: 'auto',
  currentWeek: 0, // 0 表示自动计算
};

// ============ 课程存储 ============

export async function loadCourses(): Promise<Course[]> {
  try {
    const json = await AsyncStorage.getItem(COURSES_KEY);
    if (json) {
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn('Failed to load courses:', e);
  }
  return [];
}

export async function saveCourses(courses: Course[]): Promise<void> {
  try {
    await AsyncStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  } catch (e) {
    console.warn('Failed to save courses:', e);
  }
}

export async function addCourse(course: Course): Promise<Course[]> {
  const courses = await loadCourses();
  courses.push(course);
  await saveCourses(courses);
  return courses;
}

export async function updateCourse(updated: Course): Promise<Course[]> {
  const courses = await loadCourses();
  const idx = courses.findIndex(c => c.id === updated.id);
  if (idx !== -1) {
    courses[idx] = updated;
  }
  await saveCourses(courses);
  return courses;
}

export async function deleteCourse(id: string): Promise<Course[]> {
  const courses = await loadCourses();
  const filtered = courses.filter(c => c.id !== id);
  await saveCourses(filtered);
  return filtered;
}

export async function replaceAllCourses(courses: Course[]): Promise<void> {
  await saveCourses(courses);
}

// ============ 设置存储 ============

export async function loadSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (json) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
