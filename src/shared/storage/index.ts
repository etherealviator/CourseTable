import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, AppSettings } from '../../shared/types';

const COURSES_KEY = '@courses';
const SETTINGS_KEY = '@settings';

// ── Courses ──

export async function loadCourses(): Promise<Course[]> {
  const json = await AsyncStorage.getItem(COURSES_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveCourses(courses: Course[]): Promise<void> {
  await AsyncStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

export async function replaceAllCourses(courses: Course[]): Promise<void> {
  await saveCourses(courses);
}

// ── Settings ──

const DEFAULT_SETTINGS: AppSettings = {
  semesterStart: '',
  totalWeeks: 20,
  themeMode: 'auto',
  currentWeek: 0,
  showWeekends: true,
  themeColor: '#3B82F6',
};

export async function loadSettings(): Promise<AppSettings> {
  const json = await AsyncStorage.getItem(SETTINGS_KEY);
  return json ? { ...DEFAULT_SETTINGS, ...JSON.parse(json) } : { ...DEFAULT_SETTINGS };
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const updated = { ...current, ...partial };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
