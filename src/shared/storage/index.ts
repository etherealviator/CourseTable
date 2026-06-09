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

const DEFAULT_PERIOD_TIMES = [
  '08:00-08:45', '08:55-09:40', '10:00-10:45', '10:55-11:40',
  '14:00-14:45', '14:55-15:40', '15:50-16:35', '16:45-17:30',
  '19:00-19:45', '19:55-20:40', '20:50-21:35', '21:45-22:30',
];

const DEFAULT_SETTINGS: AppSettings = {
  semesterStart: '',
  totalWeeks: 20,
  themeMode: 'auto',
  currentWeek: 0,
  showWeekends: true,
  themeColor: '#3B82F6',
  periodTimes: DEFAULT_PERIOD_TIMES,
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
