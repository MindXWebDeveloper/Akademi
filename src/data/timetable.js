import {
  createResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from './apiClient';
import { getTeacherSubjectKeys, getSubjects } from './subjects';
import { getCurrentSchoolYear } from './schoolYears';

const defaultSettings = {
  periodCount: 10,
  morningPeriods: 5,
  morningStart: '07:30',
  afternoonStart: '13:30',
  periods: Array.from({ length: 10 }, () => ({ duration: 45, breakAfter: 5 })),
};

const lessons = () => getResourceRecords('lessons').map((item) => ({
  ...item,
  id: String(item.lessonKey ?? item.id ?? item._id ?? ''),
  schoolYear: item.schoolYear ?? '',
}));

const normalizeSettings = (settings) => {
  const periodCount = Math.min(20, Math.max(1, Number(settings.periodCount) || defaultSettings.periodCount));
  return {
    ...defaultSettings,
    ...settings,
    periodCount,
    morningPeriods: Math.min(periodCount, Math.max(0, Number(settings.morningPeriods) || 0)),
    periods: Array.from({ length: periodCount }, (_, index) => ({
      duration: settings.periods?.[index]?.duration == null
        ? null
        : Number(settings.periods[index].duration) || null,
      breakAfter: Math.max(0, Number(settings.periods?.[index]?.breakAfter) || 0),
    })),
  };
};

export const getTimetableSettings = (schoolYear = getCurrentSchoolYear()) => {
  const settings = getResourceRecords('timetableSettings').find((item) => item.schoolYear === schoolYear);
  return settings ? normalizeSettings(settings) : defaultSettings;
};

export const saveTimetableSettings = async (settings, schoolYear = getCurrentSchoolYear()) => {
  const current = getResourceRecords('timetableSettings').find((item) => item.schoolYear === schoolYear);
  const next = { ...settings, id: current?.id ?? schoolYear, schoolYear };
  try {
    if (current) await updateResourceRecord('timetableSettings', { ...current, ...next });
    else await createResourceRecord('timetableSettings', next);
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const getLessons = (schoolYear = getCurrentSchoolYear()) => (
  lessons().filter((lesson) => lesson.schoolYear === schoolYear)
);

const normalizeAssignmentValue = (value) => String(value ?? '').trim().toLocaleLowerCase('vi');

export const getTeacherTeachingAssignments = (teacherKey, schoolYear = getCurrentSchoolYear()) => {
  if (!teacherKey || !schoolYear) return [];
  const teacher = getResourceRecords('teachers').find((record) => (
    String(record.teacherKey ?? record._id ?? record.id ?? '') === String(teacherKey)
  ));
  if (!teacher?.name) return [];

  const subjectIds = new Set(getTeacherSubjectKeys(teacherKey));
  const subjectsByName = new Map(getSubjects().map((subject) => [
    normalizeAssignmentValue(subject.name),
    subject,
  ]));
  const assignments = new Map();
  getLessons(schoolYear)
    .filter((lesson) => (
      normalizeAssignmentValue(lesson.teacherName) === normalizeAssignmentValue(teacher.name)
    ))
    .forEach((lesson) => {
      const subject = subjectsByName.get(normalizeAssignmentValue(lesson.subject));
      const className = String(lesson.className ?? '').trim();
      if (!subject || !subjectIds.has(subject.id) || !className) return;
      assignments.set(`${normalizeAssignmentValue(className)}|${subject.id}`, {
        className,
        subject: subject.name,
      });
    });
  return [...assignments.values()];
};

const hasConflict = (allLessons, lesson, ignoredId) => allLessons.some((existing) => (
  existing.id !== ignoredId
  && existing.schoolYear === lesson.schoolYear
  && existing.weekday === lesson.weekday
  && Number(existing.period) === Number(lesson.period)
  && (existing.className === lesson.className || existing.teacherName === lesson.teacherName)
));

const generateLessonId = (allLessons) => {
  const highestId = allLessons.reduce((highest, lesson) => {
    const match = /^TL(\d+)$/.exec(lesson.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `TL${String(highestId + 1).padStart(3, '0')}`;
};

export const saveLesson = async (lesson, lessonId) => {
  const allLessons = lessons();
  if (hasConflict(allLessons, lesson, lessonId)) return { saved: false, reason: 'conflict' };
  const existing = lessonId ? allLessons.find((item) => item.id === lessonId) : null;
  if (lessonId && !existing) return { saved: false, reason: 'not-found' };
  const next = { ...existing, ...lesson, id: lessonId ?? generateLessonId(allLessons) };
  try {
    if (existing) await updateResourceRecord('lessons', next);
    else await createResourceRecord('lessons', next);
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};
