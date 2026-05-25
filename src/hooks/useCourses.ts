// 课程数据管理 Hook

import { useState, useEffect, useCallback } from 'react';
import { Course } from '../types';
import * as storage from '../utils/storage';
import { getCurrentWeek, getTodayDayOfWeek, getDefaultSemesterStart, generateId } from '../utils/time';
import { COURSE_COLORS } from '../constants/theme';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [todayDay, setTodayDay] = useState(1);
  const [semesterStart, setSemesterStart] = useState('');
  const [loaded, setLoaded] = useState(false);

  // 加载数据
  useEffect(() => {
    (async () => {
      const [savedCourses, settings] = await Promise.all([
        storage.loadCourses(),
        storage.loadSettings(),
      ]);

      setCourses(savedCourses);

      const start = settings.semesterStart || getDefaultSemesterStart();
      setSemesterStart(start);

      const week = settings.currentWeek > 0
        ? settings.currentWeek
        : getCurrentWeek(start);
      setCurrentWeek(week);
      setTodayDay(getTodayDayOfWeek());
      setLoaded(true);
    })();
  }, []);

  // 添加课程
  const addCourse = useCallback(async (course: Omit<Course, 'id' | 'color'>) => {
    const newCourse: Course = {
      ...course,
      id: generateId(),
      color: COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)],
    };
    const updated = await storage.addCourse(newCourse);
    setCourses(updated);
    return newCourse;
  }, []);

  // 更新课程
  const updateCourse = useCallback(async (course: Course) => {
    const updated = await storage.updateCourse(course);
    setCourses(updated);
  }, []);

  // 删除课程
  const deleteCourse = useCallback(async (id: string) => {
    const updated = await storage.deleteCourse(id);
    setCourses(updated);
  }, []);

  // 批量导入
  const importCourses = useCallback(async (newCourses: Course[]) => {
    const existing = await storage.loadCourses();
    // 合并而不是覆盖
    const merged = [...existing];
    for (const nc of newCourses) {
      // 检查是否已存在相同课程
      const dup = merged.find(c =>
        c.name === nc.name &&
        c.dayOfWeek === nc.dayOfWeek &&
        c.startPeriod === nc.startPeriod
      );
      if (!dup) {
        merged.push(nc);
      }
    }
    await storage.replaceAllCourses(merged);
    setCourses(merged);
  }, []);

  // 切换当前周
  const changeWeek = useCallback(async (week: number) => {
    setCurrentWeek(week);
    await storage.saveSettings({ currentWeek: week });
  }, []);

  // 获取当前周的课程
  const getWeekCourses = useCallback((week: number) => {
    return courses.filter(c => c.weeks.includes(week));
  }, [courses]);

  // 获取某天某节次的课程
  const getCourseAtSlot = useCallback((day: number, period: number, week?: number) => {
    const w = week ?? currentWeek;
    return courses.filter(c =>
      c.dayOfWeek === day &&
      c.startPeriod <= period &&
      c.endPeriod >= period &&
      c.weeks.includes(w)
    );
  }, [courses, currentWeek]);

  return {
    courses,
    currentWeek,
    todayDay,
    semesterStart,
    loaded,
    addCourse,
    updateCourse,
    deleteCourse,
    importCourses,
    changeWeek,
    getWeekCourses,
    getCourseAtSlot,
    setSemesterStart: async (start: string) => {
      setSemesterStart(start);
      await storage.saveSettings({ semesterStart: start, currentWeek: 0 });
      setCurrentWeek(getCurrentWeek(start));
    },
  };
}
