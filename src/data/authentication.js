import { getResourceRecords } from './apiClient';

const normalizeRole = (role) => {
  const normalized = role?.trim().toLocaleLowerCase('vi');
  const roleAliases = {
    principal: 'principal',
    admin: 'principal',
    'hiệu trưởng': 'principal',
    'ban giám hiệu': 'principal',
    teacher: 'teacher',
    'giáo viên': 'teacher',
    student: 'student',
    'học sinh': 'student',
    'học sinh / phụ huynh': 'student',
  };
  return roleAliases[normalized] ?? null;
};

const matchesKey = (record, keyField, key) => (
  key != null
  && [record[keyField], record.id, record._id]
    .some((value) => value != null && String(value) === String(key))
);

export const authenticateUser = ({ username, password, role }) => {
  const normalizedUsername = username.trim().toLocaleLowerCase();
  const requestedRole = normalizeRole(role);
  const account = getResourceRecords('users').find((item) => (
    item.username?.trim().toLocaleLowerCase() === normalizedUsername
    && item.password === password
    && normalizeRole(item.role) === requestedRole
    && item.isActive !== false
  ));

  if (!account) return null;
  const teacherKey = account.teacherKey ?? account.TeacherKey;
  const studentKey = account.studentKey ?? account.StudentKey;
  const linkedProfile = teacherKey
    ? getResourceRecords('teachers').find((item) => matchesKey(item, 'teacherKey', teacherKey))
    : getResourceRecords('students').find((item) => matchesKey(item, 'studentKey', studentKey));
  if (!linkedProfile) {
    const linkedResource = teacherKey ? 'Teachers' : 'Students';
    const linkedKey = teacherKey ?? studentKey;
    throw new Error(`Tài khoản đúng nhưng không tìm thấy hồ sơ ${linkedResource} với key ${linkedKey}.`);
  }

  return {
    username: account.username,
    displayName: linkedProfile.name,
    role: requestedRole,
    teacherKey: teacherKey ?? null,
    studentKey: studentKey ?? null,
  };
};
