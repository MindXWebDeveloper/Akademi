import {
  createResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from './apiClient';
import { getRecords } from './schoolRecords';
import { getCurrentSchoolYear } from './schoolYears';
import { createLinkedUserAccount, createUsernameFromName } from './userAccounts';

const studentRecords = () => getResourceRecords('students').map((student) => ({
  ...student,
  id: String(student.studentKey ?? student.id ?? student._id ?? ''),
}));

const enrollmentId = (studentId, schoolYear) => `${studentId}|${schoolYear}`;

const enrollmentRecords = () => getResourceRecords('enrollments').map((item) => ({
  ...item,
  id: String(item.enrollmentKey ?? item.id ?? enrollmentId(item.studentId, item.schoolYear)),
}));

export const getStudentEnrollments = (studentId) => {
  const records = enrollmentRecords();
  return studentId ? records.filter((item) => item.studentId === studentId) : records;
};

export const assignStudentEnrollments = async (assignments) => {
  const studentIds = new Set(studentRecords().map((student) => student.id));
  const assignmentKeys = new Set();
  for (const assignment of assignments) {
    const key = enrollmentId(assignment.studentId, assignment.schoolYear);
    if (!studentIds.has(assignment.studentId) || !assignment.schoolYear || !assignment.className || assignmentKeys.has(key)) {
      return { saved: false, reason: 'invalid-assignment' };
    }
    assignmentKeys.add(key);
  }

  const completed = [];
  for (const assignment of assignments) {
    const id = enrollmentId(assignment.studentId, assignment.schoolYear);
    const existing = enrollmentRecords().find((item) => item.id === id);
    const next = { ...existing, ...assignment, id };
    try {
      if (existing) await updateResourceRecord('enrollments', next);
      else await createResourceRecord('enrollments', next);
      completed.push(id);
    } catch (error) {
      return { saved: false, reason: 'partial-failure', error, completed };
    }
  }
  return { saved: true, completed };
};

export const getStudents = (schoolYear = getCurrentSchoolYear()) => {
  const enrollments = enrollmentRecords().filter((item) => item.schoolYear === schoolYear);
  const enrollmentByStudent = new Map(enrollments.map((item) => [item.studentId, item]));
  return studentRecords().map((student) => ({
    ...student,
    classId: enrollmentByStudent.get(student.id)?.classId ?? null,
    className: enrollmentByStudent.get(student.id)?.className ?? '',
    schoolYear,
  }));
};

export const getStudentById = (studentId, schoolYear = getCurrentSchoolYear()) => (
  getStudents(schoolYear).find((student) => student.id === studentId)
);

export const generateStudentId = () => {
  const highestId = studentRecords().reduce((highest, student) => {
    const match = /^HS(\d+)$/.exec(student.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `HS${String(highestId + 1).padStart(3, '0')}`;
};

export const createStudent = async (newStudent, schoolYear = getCurrentSchoolYear()) => {
  const students = studentRecords();
  const studentId = newStudent.id?.trim();
  if (!studentId || students.some((student) => student.id === studentId)) {
    return { saved: false, reason: 'duplicate' };
  }

  const profile = { ...newStudent, id: studentId, status: 'Đang học' };
  delete profile.classId;
  delete profile.schoolYear;
  let created;
  try {
    created = await createResourceRecord('students', profile);
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }

  const className = newStudent.className?.trim() ?? '';
  const matchingClass = getRecords('classes').find((item) => (
    item.schoolYear === schoolYear && item.name === className
  ));
  const enrollmentResult = await assignStudentEnrollments([{
    studentId,
    schoolYear,
    classId: matchingClass?.id ?? null,
    className,
  }]);
  const completed = [{ resource: 'students', id: created._id }];
  const remaining = [];
  if (enrollmentResult.saved) completed.push({ resource: 'enrollments', id: enrollmentId(studentId, schoolYear) });
  else remaining.push('enrollment');

  const username = createUsernameFromName(newStudent.name ?? '');
  let account;
  try {
    account = await createLinkedUserAccount({
      role: 'student',
      profileKey: studentId,
      fullName: newStudent.name ?? '',
      username,
    });
    completed.push({ resource: 'users', id: account.created._id });
  } catch (error) {
    return {
      saved: false,
      reason: 'partial-failure',
      error,
      completed,
      remaining: [...remaining, 'users'],
      username,
      studentCode: studentId,
    };
  }

  if (remaining.length) {
    return {
      saved: false,
      reason: 'partial-failure',
      error: enrollmentResult.error,
      completed,
      remaining,
      username: account.username,
      studentCode: studentId,
    };
  }

  return {
    saved: true,
    student: created,
    username: account.username,
    studentCode: studentId,
  };
};

export const saveStudent = async (originalStudentId, updatedStudent) => {
  const existing = studentRecords().find((student) => student.id === originalStudentId);
  if (!existing) return { saved: false, reason: 'not-found' };
  if (studentRecords().some((student) => student.id === updatedStudent.id && student.id !== originalStudentId)) {
    return { saved: false, reason: 'duplicate' };
  }

  const profile = { ...existing, ...updatedStudent };
  delete profile.classId;
  delete profile.schoolYear;
  try {
    await updateResourceRecord('students', profile);
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }

  if (updatedStudent.schoolYear && updatedStudent.className?.trim()) {
    const schoolYear = updatedStudent.schoolYear;
    const className = updatedStudent.className.trim();
    const matchingClass = getRecords('classes').find((item) => (
      item.schoolYear === schoolYear && item.name === className
    ));
    const enrollmentResult = await assignStudentEnrollments([{
      studentId: originalStudentId,
      schoolYear,
      classId: matchingClass?.id ?? null,
      className,
    }]);
    if (!enrollmentResult.saved) {
      return {
        saved: false,
        reason: 'partial-failure',
        error: enrollmentResult.error,
        completed: [{ resource: 'students', id: existing._id }],
      };
    }
  }
  return { saved: true };
};
