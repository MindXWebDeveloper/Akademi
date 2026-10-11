import { getResourceRecords } from './apiClient';

export const getAllSubjects = () => getResourceRecords('subjects')
  .map((subject) => ({
    ...subject,
    id: String(subject.subjectKey ?? subject.id ?? subject._id ?? ''),
    name: String(subject.name ?? subject.subjectName ?? '').trim(),
  }))
  .filter((subject) => subject.id && subject.name);

export const getSubjects = () => getAllSubjects()
  .filter((subject) => subject.isActive !== false);

export const getSubjectByName = (name) => getSubjects().find((subject) => subject.name === name);

export const getTeacherSubjectKeys = (teacherKey) => {
  const teacher = getResourceRecords('teachers').find((record) => (
    String(record.teacherKey ?? record._id ?? record.id ?? '') === String(teacherKey)
  ));
  return (teacher?.subjectKeys ?? []).map(String);
};

export const getTeacherSubjectNames = (teacherKey) => {
  const subjectIds = new Set(getTeacherSubjectKeys(teacherKey));
  return getSubjects()
    .filter((subject) => subjectIds.has(subject.id))
    .map((subject) => subject.name);
};
