import { getSchoolYearNameById } from './schoolYears';

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
      { name: 'subject', label: 'Môn giảng dạy', placeholder: 'Nhập môn học' },
    ],
    fields: [
      { name: 'id', label: 'Mã giáo viên', required: true, readOnlyOnCreate: true },
      { name: 'name', label: 'Họ và tên', required: true },
      { name: 'gender', label: 'Giới tính', required: true, type: 'select', options: ['Nam', 'Nữ', 'Khác'] },
      { name: 'birthYear', label: 'Năm sinh', required: true, type: 'year' },
      { name: 'subject', label: 'Môn giảng dạy', required: true },
      { name: 'qualification', label: 'Trình độ chuyên môn', required: true },
      { name: 'phone', label: 'Số điện thoại', required: true, type: 'phone' },
      { name: 'email', label: 'Email', required: true, type: 'email' },
      { name: 'address', label: 'Địa chỉ', required: true, wide: true },
    ],
    columns: [
      { title: 'Mã giáo viên', dataIndex: 'id', key: 'id' },
      { title: 'Họ và tên', dataIndex: 'name', key: 'name' },
      { title: 'Môn giảng dạy', dataIndex: 'subject', key: 'subject' },
      { title: 'Trình độ', dataIndex: 'qualification', key: 'qualification' },
      { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
    ],
    initialRecords: [
      { id: 'GV001', name: 'Nguyễn Thu Hà', gender: 'Nữ', birthYear: '1985', subject: 'Toán', qualification: 'Thạc sĩ', phone: '0912345001', email: 'thuha@example.com', address: 'Ba Đình, Hà Nội' },
      { id: 'GV002', name: 'Trần Quốc Bảo', gender: 'Nam', birthYear: '1981', subject: 'Ngữ văn', qualification: 'Thạc sĩ', phone: '0912345002', email: 'quocbao@example.com', address: 'Cầu Giấy, Hà Nội' },
      { id: 'GV003', name: 'Lê Minh Trang', gender: 'Nữ', birthYear: '1990', subject: 'Tiếng Anh', qualification: 'Cử nhân', phone: '0912345003', email: 'minhtrang@example.com', address: 'Đống Đa, Hà Nội' },
      { id: 'GV004', name: 'Phạm Đức Long', gender: 'Nam', birthYear: '1983', subject: 'Vật lý', qualification: 'Thạc sĩ', phone: '0912345004', email: 'duclong@example.com', address: 'Thanh Xuân, Hà Nội' },
      { id: 'GV005', name: 'Võ Ngọc Mai', gender: 'Nữ', birthYear: '1988', subject: 'Hóa học', qualification: 'Cử nhân', phone: '0912345005', email: 'ngocmai@example.com', address: 'Long Biên, Hà Nội' },
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
    initialRecords: [
      { id: 'LH001', name: '10A1', grade: '10', homeroomTeacher: 'Nguyễn Thu Hà', room: 'A101', schoolYear: '2026-2027', capacity: '40' },
      { id: 'LH002', name: '10A2', grade: '10', homeroomTeacher: 'Trần Quốc Bảo', room: 'A102', schoolYear: '2026-2027', capacity: '40' },
      { id: 'LH003', name: '11A1', grade: '11', homeroomTeacher: 'Lê Minh Trang', room: 'B101', schoolYear: '2026-2027', capacity: '38' },
      { id: 'LH004', name: '11A2', grade: '11', homeroomTeacher: 'Phạm Đức Long', room: 'B102', schoolYear: '2026-2027', capacity: '38' },
      { id: 'LH005', name: '12A1', grade: '12', homeroomTeacher: 'Võ Ngọc Mai', room: 'C101', schoolYear: '2026-2027', capacity: '36' },
    ],
  },
};

const storageKey = (type) => `akademi.${type}`;
let backendClasses = [];
let classesInitializationPromise;

const normalizeApiClasses = (payload) => {
  const records = payload?.data?.data ?? payload?.data ?? payload;
  const flattenRecords = (value) => {
    if (Array.isArray(value)) return value.flatMap(flattenRecords);
    if (!value || typeof value !== 'object') return [];
    if (typeof value.name === 'string' && value.schoolYearId) return [value];
    return Object.values(value).flatMap(flattenRecords);
  };

  return flattenRecords(records).map((record) => ({
    ...record,
    id: String(record._id ?? record.id ?? ''),
    schoolYear: record.schoolYear ?? getSchoolYearNameById(record.schoolYearId) ?? '',
    capacity: String(record.capacity ?? ''),
  })).filter((record) => record.id && record.name);
};

export const initializeSchoolRecords = async () => {
  if (classesInitializationPromise) return classesInitializationPromise;

  classesInitializationPromise = (async () => {
    const apiUrl = import.meta.env.VITE_CLASSES_API_URL;
    if (!apiUrl) return getRecords('classes');

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Classes API returned ${response.status}`);
      const records = normalizeApiClasses(await response.json());
      if (!records.length) throw new Error('Classes API returned no valid records');
      backendClasses = records;
    } catch (error) {
      console.error('Could not load classes from API; using local fallback.', error);
    }

    return getRecords('classes');
  })();

  return classesInitializationPromise;
};

export const getRecordDefinition = (type) => recordDefinitions[type];

export const getRecords = (type) => {
  const definition = recordDefinitions[type];
  if (!definition) return [];

  try {
    const records = localStorage.getItem(storageKey(type));
    if (records) return JSON.parse(records);
    if (type === 'classes' && backendClasses.length) return backendClasses;
    return definition.initialRecords;
  } catch {
    if (type === 'classes' && backendClasses.length) return backendClasses;
    return definition.initialRecords;
  }
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

export const saveRecord = (type, originalId, record) => {
  const records = getRecords(type);
  const index = records.findIndex((item) => item.id === originalId);
  if (index < 0 || records.some((item) => item.id === record.id && item.id !== originalId)) {
    return false;
  }
  if (type === 'classes' && records.some((item) => (
    item.id !== originalId
    && item.name.toLocaleLowerCase('vi') === record.name.toLocaleLowerCase('vi')
    && item.schoolYear === record.schoolYear
  ))) return false;

  records[index] = record;
  try {
    localStorage.setItem(storageKey(type), JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
};

export const createRecord = (type, record) => {
  const records = getRecords(type);
  if (!record.id || records.some((item) => item.id === record.id)) return false;
  if (type === 'classes' && records.some((item) => (
    item.name.toLocaleLowerCase('vi') === record.name.toLocaleLowerCase('vi')
    && item.schoolYear === record.schoolYear
  ))) return false;

  try {
    localStorage.setItem(storageKey(type), JSON.stringify([...records, record]));
    return true;
  } catch {
    return false;
  }
};

export const createRecordsBatch = (type, newRecords) => {
  const definition = recordDefinitions[type];
  if (!definition || !newRecords.length) return { saved: newRecords.length === 0, records: [] };

  const records = getRecords(type);
  const ids = new Set(records.map((record) => record.id));
  const classKeys = new Set(type === 'classes'
    ? records.map((record) => `${record.schoolYear}|${record.name.toLocaleLowerCase('vi')}`)
    : []);
  for (const record of newRecords) {
    if (!record.id || ids.has(record.id)) return { saved: false, reason: 'duplicate' };
    ids.add(record.id);
    if (type === 'classes') {
      const classKey = `${record.schoolYear}|${record.name.toLocaleLowerCase('vi')}`;
      if (classKeys.has(classKey)) return { saved: false, reason: 'duplicate' };
      classKeys.add(classKey);
    }
  }

  try {
    localStorage.setItem(storageKey(type), JSON.stringify([...records, ...newRecords]));
    return { saved: true, records: newRecords };
  } catch {
    return { saved: false, reason: 'storage' };
  }
};

export const removeRecordsByIds = (type, idsToRemove) => {
  const ids = new Set(idsToRemove);
  const records = getRecords(type);
  try {
    localStorage.setItem(storageKey(type), JSON.stringify(records.filter((record) => !ids.has(record.id))));
    return true;
  } catch {
    return false;
  }
};
