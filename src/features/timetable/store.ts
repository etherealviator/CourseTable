import { create } from 'zustand';
import { Course, AppSettings } from '../../shared/types';
import * as storage from '../../shared/storage';
import { getCurrentWeek, getTodayDayOfWeek, getDefaultSemesterStart, generateId } from '../../shared/utils/time';
import { COURSE_COLORS } from '../../shared/constants/theme';

interface TimetableState {
  courses: Course[];
  currentWeek: number;
  todayDay: number;
  semesterStart: string;
  loaded: boolean;
  settings: AppSettings | null;

  init: () => Promise<void>;
  addCourse: (c: Omit<Course, 'id' | 'color'>) => Course;
  updateCourse: (c: Course) => void;
  deleteCourse: (id: string) => void;
  importCourses: (newCourses: Course[]) => void;
  setWeek: (w: number) => void;
  setSemesterStart: (start: string) => void;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

export const useTimetable = create<TimetableState>((set, get) => ({
  courses: [],
  currentWeek: 1,
  todayDay: 1,
  semesterStart: '',
  loaded: false,
  settings: null,

  init: async () => {
    const [courses, settings] = await Promise.all([
      storage.loadCourses(),
      storage.loadSettings(),
    ]);
    const start = settings.semesterStart || getDefaultSemesterStart();
    set({
      courses,
      settings,
      semesterStart: start,
      currentWeek: settings.currentWeek > 0 ? settings.currentWeek : getCurrentWeek(start),
      todayDay: getTodayDayOfWeek(),
      loaded: true,
    });
  },

  addCourse: (c) => {
    const nc: Course = {
      ...c,
      id: generateId(),
      color: COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)],
    };
    const updated = [...get().courses, nc];
    set({ courses: updated });
    storage.saveCourses(updated);
    return nc;
  },

  updateCourse: (c) => {
    const updated = get().courses.map(x => x.id === c.id ? c : x);
    set({ courses: updated });
    storage.saveCourses(updated);
  },

  deleteCourse: (id) => {
    const updated = get().courses.filter(c => c.id !== id);
    set({ courses: updated });
    storage.saveCourses(updated);
  },

  importCourses: (newCourses) => {
    const existing = get().courses;
    const merged = [...existing];
    for (const nc of newCourses) {
      const dup = merged.find(c =>
        c.name === nc.name && c.dayOfWeek === nc.dayOfWeek &&
        c.startPeriod === nc.startPeriod && c.endPeriod === nc.endPeriod &&
        JSON.stringify(c.weeks) === JSON.stringify(nc.weeks)
      );
      if (!dup) merged.push(nc);
    }
    set({ courses: merged });
    storage.replaceAllCourses(merged);
  },

  setWeek: (w) => {
    set({ currentWeek: w });
    storage.saveSettings({ currentWeek: w });
  },

  setSemesterStart: (start) => {
    set({ semesterStart: start, currentWeek: getCurrentWeek(start) });
    storage.saveSettings({ semesterStart: start, currentWeek: 0 });
  },

  updateSettings: async (partial) => {
    const updated = await storage.saveSettings(partial);
    set({ settings: updated });
  },
}));
