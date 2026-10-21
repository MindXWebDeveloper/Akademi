import { getSchoolYearIdByName, getSchoolYearNameById } from './schoolYears';
import {
  createResourceRecord,
  deleteResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from './apiClient';
import { createLinkedUserAccount, createUsernameFromName } from './userAccounts';
import { getTeacherSubjectKeys, getTeacherSubjectNames } from './subjects';
import { hasDuplicatePersonProfile, normalizeRecordName } from './recordValidation';

const recordDefinitions = {
  teachers: {
    title: 'Quản lý giáo viên',
    singular: 'giáo viên',
    idLabel: 'Mã giáo viên',
    idPrefix: 'GV',
    route: '/teachers',
    searchableFields: [
      { name: 'id', label: 'Mã giáo viên', placeholder: 'Ví dụ: GV001' },
      { name: 'name', label: 'Tên giáo viên', placeholder: 'Nhập họ tên' },
      { name: 'subject', label: 'Môn giảng dạy', type: 'subjects', placeholder: 'Chọn môn học' },
    ],
    fields: [
      { name: 'id', label: 'Mã giáo viên', required: true, readOnlyOnCreate: true },
      { name: 'name', label: 'Họ và tên', required: true },
      { name: 'gender', label: 'Giới tính', required: true, type: 'select', options: ['Nam', 'Nữ', 'Khác'] },
      { name: 'birthYear', label: 'Năm sinh', required: true, type: 'year' },
      { name: 'subjectKeys', label: 'Môn giảng dạy', required: true, type: 'subjects', wide: true },
      { name: 'qualification', label: 'Trình độ chuyên môn', required: true },
      { name: 'phone', label: 'Số điện thoại', required: true, type: 'phone' },
      { name: 'email', label: 'Email', required: true, type: 'email' },
      { name: 'address', label: 'Địa chỉ', required: true, wide: true },
    ],
    columns: [
      { title: 'Mã giáo viên', dataIndex: 'id', key: 'id' },
      { title: 'Họ và tên', dataIndex: 'name', key: 'name' },
      { title: 'Môn giảng dạy', dataIndex: 'subjects', key: 'subjects' },
      { title: 'Trình độ', dataIndex: 'qualification', key: 'qualification' },
      { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
    ],
  },
  classes: {
    title: 'Quản lý lớp học',
    singular: 'lớp học',
    idLabel: 'Mã lớp',
    idPrefix: 'LH',
    route: '/classes',
    searchableFields: [
      { name: 'id', label: 'Mã lớp', placeholder: 'Ví dụ: LH001' },
      { name: 'name', label: 'Tên lớp', placeholder: 'Ví dụ: 10A1' },
      { name: 'grade', label: 'Khối', placeholder: 'Ví dụ: 10' },
    ],
    fields: [
      { name: 'id', label: 'Mã lớp', required: true, readOnlyOnCreate: true },
      { name: 'name', label: 'Tên lớp', required: true },
      { name: 'grade', label: 'Khối', required: true },
      { name: 'homeroomTeacher', label: 'Giáo viên chủ nhiệm', required: true },
      { name: 'room', label: 'Phòng học', required: true },
      { name: 'schoolYear', label: 'Năm học', required: true, type: 'schoolYear' },
      { name: 'capacity', label: 'Sĩ số tối đa', required: true, type: 'number' },
    ],
    columns: [
      { title: 'Mã lớp', dataIndex: 'id', key: 'id' },
      { title: 'Tên lớp', dataIndex: 'name', key: 'name' },
      { title: 'Khối', dataIndex: 'grade', key: 'grade' },
      { title: 'Giáo viên chủ nhiệm', dataIndex: 'homeroomTeacher', key: 'homeroomTeacher' },
      { title: 'Phòng học', dataIndex: 'room', key: 'room' },
      { title: 'Năm học', dataIndex: 'schoolYear', key: 'schoolYear' },
      { title: 'Sĩ số tối đa', dataIndex: 'capacity', key: 'capacity' },
    ],
  },
};

const apiResource = (type) => (type === 'classes' ? 'classes' : 'teachers');

export const initializeSchoolRecords = async () => getRecords('classes');

export const getRecordDefinition = (type) => recordDefinitions[type];

export const getRecords = (type) => {
  const definition = recordDefinitions[type];
  if (!definition) return [];
  return getResourceRecords(apiResource(type)).map((record) => ({
    ...record,
    id: String(type === 'classes'
      ? (record.classKey ?? record._id ?? record.id ?? '')
      : (record.teacherKey ?? record._id ?? record.id ?? '')),
    ...(type === 'classes' ? {
      schoolYear: record.schoolYear ?? getSchoolYearNameById(record.schoolYearId) ?? '',
      capacity: String(record.capacity ?? ''),
    } : {
      subjectKeys: getTeacherSubjectKeys(record.teacherKey ?? record.id),
      subjects: getTeacherSubjectNames(record.teacherKey ?? record.id).join(', '),
      subject: getTeacherSubjectNames(record.teacherKey ?? record.id).join(', '),
    }),
  })).filter((record) => record.id);
};

export const getRecordById = (type, id) => (
  getRecords(type).find((record) => record.id === id)
);

export const generateRecordId = (type) => {
  const definition = recordDefinitions[type];
  const highestId = getRecords(type).reduce((highest, record) => {
    const match = new RegExp(`^${definition.idPrefix}(\\d+)$`).exec(record.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `${definition.idPrefix}${String(highestId + 1).padStart(3, '0')}`;
};

const apiRecord = (type, record) => {
  if (type !== 'classes') return record;
  const schoolYearId = getSchoolYearId(record.schoolYear) ?? record.schoolYearId;
  return { ...record, ...(schoolYearId ? { schoolYearId } : {}) };
};

const getSchoolYearId = (schoolYear) => (
  getSchoolYearIdByName(schoolYear)
);

export const saveRecord = async (type, originalId, record) => {
  const records = getRecords(type);
  const index = records.findIndex((item) => item.id === originalId);
  if (index < 0) return { saved: false, reason: 'not-found' };
  if (records.some((item) => item.id === record.id && item.id !== originalId)) {
    return { saved: false, reason: 'duplicate-id' };
  }
  if (type === 'classes' && records.some((item) => (
    item.id !== originalId && normalizeRecordName(item.name) === normalizeRecordName(record.name)
  ))) return { saved: false, reason: 'duplicate-name' };
  if (type === 'teachers' && hasDuplicatePersonProfile(records, record, originalId)) {
    return { saved: false, reason: 'duplicate-profile' };
  }

  try {
    const existing = records[index];
    await updateResourceRecord(apiResource(type), apiRecord(type, { ...existing, ...record }));
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const createRecord = async (type, record) => {
  const records = getRecords(type);
  if (!record.id || records.some((item) => item.id === record.id)) return false;
  if (type === 'classes' && records.some((item) => (
    normalizeRecordName(item.name) === normalizeRecordName(record.name)
  ))) return { saved: false, reason: 'duplicate-name' };
  if (type === 'teachers' && hasDuplicatePersonProfile(records, record)) {
    return { saved: false, reason: 'duplicate-profile' };
  }

  try {
    const created = await createResourceRecord(apiResource(type), apiRecord(type, record));
    if (type !== 'teachers') return { saved: true, record: created };

    const username = createUsernameFromName(record.name);
    try {
      const account = await createLinkedUserAccount({
        role: 'teacher',
        profileKey: record.id,
        fullName: record.name,
        username,
      });
      return {
        saved: true,
        record: created,
        username: account.username,
        teacherCode: record.id,
      };
    } catch (error) {
      return {
        saved: false,
        reason: 'partial-failure',
        error,
        record: created,
        completed: [{ resource: 'teachers', id: created._id }],
        remaining: ['users'],
        username,
        teacherCode: record.id,
      };
    }
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const createRecordsBatch = async (type, newRecords) => {
  const definition = recordDefinitions[type];
  if (!definition || !newRecords.length) return { saved: newRecords.length === 0, records: [] };

  const records = getRecords(type);
  const ids = new Set(records.map((record) => record.id));
  const classKeys = new Set(type === 'classes'
    ? records.map((record) => normalizeRecordName(record.name))
    : []);
  for (const record of newRecords) {
    if (!record.id || ids.has(record.id)) return { saved: false, reason: 'duplicate' };
    ids.add(record.id);
    if (type === 'classes') {
      const classKey = normalizeRecordName(record.name);
      if (classKeys.has(classKey)) return { saved: false, reason: 'duplicate' };
      classKeys.add(classKey);
    }
  }

  const created = [];
  for (const record of newRecords) {
    try {
      created.push(await createResourceRecord(apiResource(type), apiRecord(type, record)));
    } catch (error) {
      return { saved: false, reason: 'partial-failure', error, records: created };
    }
  }
  return { saved: true, records: created };
};

export const removeRecordsByIds = async (type, idsToRemove) => {
  const ids = new Set(idsToRemove);
  const records = getRecords(type);
  const removed = [];
  for (const record of records.filter((item) => ids.has(item.id))) {
    try {
      await deleteResourceRecord(apiResource(type), record);
      removed.push(record.id);
    } catch (error) {
      return { removed: false, reason: 'partial-failure', error, completed: removed };
    }
  }
  return { removed: true, completed: removed };
};
