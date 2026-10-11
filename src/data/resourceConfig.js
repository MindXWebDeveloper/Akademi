export const resourceConfig = {
  schoolYears: {
    name: 'SchoolYears',
    keyField: 'schoolYearKey',
    urlKey: 'schoolYearsUrl',
    updateUrlKey: 'schoolYearsUpdateUrl',
  },
  roles: { name: 'Roles', keyField: 'roleKey' },
  users: { name: 'Users', keyField: 'accountKey' },
  classes: { name: 'Classes', keyField: 'classKey', urlKey: 'classesUrl' },
  teachers: { name: 'Teachers', keyField: 'teacherKey' },
  students: { name: 'Students', keyField: 'studentKey' },
  enrollments: { name: 'StudentEnrollments', keyField: 'enrollmentKey' },
  grades: { name: 'Grades', keyField: 'gradeKey' },
  transcripts: { name: 'StudentTranscripts', keyField: 'transcriptKey' },
  notices: { name: 'Notices', keyField: 'noticeKey' },
  activities: { name: 'ExtracurricularActivities', keyField: 'activityKey' },
  books: { name: 'Books', keyField: 'bookKey' },
  loans: { name: 'BookLoans', keyField: 'loanKey' },
  lessons: { name: 'TimetableLessons', keyField: 'lessonKey' },
  timetableSettings: { name: 'TimetableSettings', keyField: 'timetableSettingsKey' },
  promotionPlans: { name: 'ClassPromotionPlans', keyField: 'promotionPlanKey' },
};

export const resourceKeys = Object.keys(resourceConfig);
