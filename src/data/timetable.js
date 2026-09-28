const initialLessons = [
  { id: 'TL001', className: '10A1', teacherName: 'Nguyễn Thu Hà', weekday: 'monday', period: 1, subject: 'Toán', room: 'A101' },
  { id: 'TL002', className: '10A1', teacherName: 'Trần Quốc Bảo', weekday: 'monday', period: 2, subject: 'Ngữ văn', room: 'A101' },
  { id: 'TL003', className: '10A1', teacherName: 'Lê Minh Trang', weekday: 'monday', period: 3, subject: 'Tiếng Anh', room: 'A101' },
  { id: 'TL004', className: '10A1', teacherName: 'Phạm Đức Long', weekday: 'tuesday', period: 1, subject: 'Vật lý', room: 'A101' },
  { id: 'TL005', className: '10A1', teacherName: 'Võ Ngọc Mai', weekday: 'tuesday', period: 2, subject: 'Hóa học', room: 'A101' },
  { id: 'TL006', className: '10A1', teacherName: 'Nguyễn Thu Hà', weekday: 'tuesday', period: 4, subject: 'Toán', room: 'A101' },
  { id: 'TL007', className: '10A1', teacherName: 'Trần Quốc Bảo', weekday: 'wednesday', period: 1, subject: 'Ngữ văn', room: 'A101' },
  { id: 'TL008', className: '10A1', teacherName: 'Lê Minh Trang', weekday: 'wednesday', period: 2, subject: 'Tiếng Anh', room: 'A101' },
  { id: 'TL009', className: '10A1', teacherName: 'Phạm Đức Long', weekday: 'thursday', period: 1, subject: 'Vật lý', room: 'A101' },
  { id: 'TL010', className: '10A1', teacherName: 'Võ Ngọc Mai', weekday: 'thursday', period: 2, subject: 'Hóa học', room: 'A101' },
  { id: 'TL011', className: '10A1', teacherName: 'Nguyễn Thu Hà', weekday: 'friday', period: 1, subject: 'Toán', room: 'A101' },
  { id: 'TL012', className: '10A1', teacherName: 'Trần Quốc Bảo', weekday: 'friday', period: 2, subject: 'Ngữ văn', room: 'A101' },
  { id: 'TL013', className: '10A1', teacherName: 'Lê Minh Trang', weekday: 'saturday', period: 1, subject: 'Tiếng Anh', room: 'A101' },
  { id: 'TL014', className: '10A2', teacherName: 'Nguyễn Thu Hà', weekday: 'monday', period: 2, subject: 'Toán', room: 'A102' },
  { id: 'TL015', className: '10A2', teacherName: 'Trần Quốc Bảo', weekday: 'tuesday', period: 1, subject: 'Ngữ văn', room: 'A102' },
  { id: 'TL016', className: '10A2', teacherName: 'Lê Minh Trang', weekday: 'wednesday', period: 3, subject: 'Tiếng Anh', room: 'A102' },
  { id: 'TL017', className: '11A1', teacherName: 'Phạm Đức Long', weekday: 'monday', period: 1, subject: 'Vật lý', room: 'B101' },
  { id: 'TL018', className: '11A1', teacherName: 'Võ Ngọc Mai', weekday: 'tuesday', period: 3, subject: 'Hóa học', room: 'B101' },
  { id: 'TL019', className: '11A1', teacherName: 'Nguyễn Thu Hà', weekday: 'wednesday', period: 1, subject: 'Toán', room: 'B101' },
  { id: 'TL020', className: '11A2', teacherName: 'Trần Quốc Bảo', weekday: 'monday', period: 1, subject: 'Ngữ văn', room: 'B102' },
  { id: 'TL021', className: '11A2', teacherName: 'Lê Minh Trang', weekday: 'tuesday', period: 2, subject: 'Tiếng Anh', room: 'B102' },
  { id: 'TL022', className: '11A2', teacherName: 'Phạm Đức Long', weekday: 'wednesday', period: 1, subject: 'Vật lý', room: 'B102' },
];

const storageKey = 'akademi.timetable';
const settingsStorageKey = 'akademi.timetable.settings';
const defaultSettings = {
  periodCount: 10,
  morningPeriods: 5,
  morningStart: '07:30',
  afternoonStart: '13:30',
  periods: Array.from({ length: 10 }, () => ({ duration: 45, breakAfter: 5 })),
};

export const getTimetableSettings = () => {
  try {
    const storedSettings = localStorage.getItem(settingsStorageKey);
    if (!storedSettings) return defaultSettings;

    const settings = JSON.parse(storedSettings);
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
  } catch {
    return defaultSettings;
  }
};

export const saveTimetableSettings = (settings) => {
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
};

export const getLessons = () => {
  try {
    const storedLessons = localStorage.getItem(storageKey);
    return storedLessons ? JSON.parse(storedLessons) : initialLessons;
  } catch {
    return initialLessons;
  }
};

const hasConflict = (lessons, lesson, ignoredId) => lessons.some((existing) => (
  existing.id !== ignoredId
  && existing.weekday === lesson.weekday
  && Number(existing.period) === Number(lesson.period)
  && (existing.className === lesson.className || existing.teacherName === lesson.teacherName)
));

const generateLessonId = (lessons) => {
  const highestId = lessons.reduce((highest, lesson) => {
    const match = /^TL(\d+)$/.exec(lesson.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `TL${String(highestId + 1).padStart(3, '0')}`;
};

export const saveLesson = (lesson, lessonId) => {
  const lessons = getLessons();
  if (hasConflict(lessons, lesson, lessonId)) {
    return { saved: false, reason: 'conflict' };
  }

  const updatedLessons = lessonId
    ? lessons.map((existing) => (existing.id === lessonId ? { ...lesson, id: lessonId } : existing))
    : [...lessons, { ...lesson, id: generateLessonId(lessons) }];

  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedLessons));
    return { saved: true };
  } catch {
    return { saved: false, reason: 'storage' };
  }
};
