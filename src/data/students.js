import { getRecords } from './schoolRecords';
import { defaultSchoolYear, getCurrentSchoolYear } from './schoolYears';

const initialStudents = [
  { id: 'HS001', name: 'Nguyễn Minh Anh', birthYear: '2010', hometown: 'Hà Nội', gender: 'Nữ', ethnicity: 'Kinh', address: 'Ba Đình, Hà Nội', phone: '0901234567', email: 'minhanh@example.com', className: '10A1', guardian: 'Nguyễn Văn Minh', status: 'Đang học' },
  { id: 'HS002', name: 'Trần Gia Bảo', birthYear: '2010', hometown: 'Hải Phòng', gender: 'Nam', ethnicity: 'Kinh', address: 'Lê Chân, Hải Phòng', phone: '0902345678', email: 'giabao@example.com', className: '10A1', guardian: 'Trần Thị Lan', status: 'Đang học' },
  { id: 'HS003', name: 'Lê Khánh Chi', birthYear: '2010', hometown: 'Nam Định', gender: 'Nữ', ethnicity: 'Kinh', address: 'Đống Đa, Hà Nội', phone: '0903456789', email: 'khanhchi@example.com', className: '10A1', guardian: 'Lê Văn Hùng', status: 'Đang học' },
  { id: 'HS004', name: 'Phạm Đức Huy', birthYear: '2010', hometown: 'Nghệ An', gender: 'Nam', ethnicity: 'Kinh', address: 'Cầu Giấy, Hà Nội', phone: '0904567890', email: 'duchuy@example.com', className: '10A2', guardian: 'Phạm Thị Hoa', status: 'Đang học' },
  { id: 'HS005', name: 'Võ Ngọc Hà', birthYear: '2010', hometown: 'Đà Nẵng', gender: 'Nữ', ethnicity: 'Kinh', address: 'Thanh Khê, Đà Nẵng', phone: '0905678901', email: 'ngocha@example.com', className: '10A2', guardian: 'Võ Minh Tuấn', status: 'Đang học' },
  { id: 'HS006', name: 'Đặng Tuấn Kiệt', birthYear: '2010', hometown: 'Thái Bình', gender: 'Nam', ethnicity: 'Kinh', address: 'Hai Bà Trưng, Hà Nội', phone: '0906789012', email: 'tuankiet@example.com', className: '10A2', guardian: 'Đặng Thị Mai', status: 'Tạm nghỉ' },
  { id: 'HS007', name: 'Bùi Phương Linh', birthYear: '2009', hometown: 'Hà Nội', gender: 'Nữ', ethnicity: 'Kinh', address: 'Long Biên, Hà Nội', phone: '0907890123', email: 'phuonglinh@example.com', className: '11A1', guardian: 'Bùi Quốc Khánh', status: 'Đang học' },
  { id: 'HS008', name: 'Đỗ Hoàng Nam', birthYear: '2009', hometown: 'Thanh Hóa', gender: 'Nam', ethnicity: 'Kinh', address: 'Hoàng Mai, Hà Nội', phone: '0908901234', email: 'hoangnam@example.com', className: '11A1', guardian: 'Đỗ Thu Hương', status: 'Đang học' },
  { id: 'HS009', name: 'Nguyễn Thảo Vy', birthYear: '2009', hometown: 'Hà Nội', gender: 'Nữ', ethnicity: 'Kinh', address: 'Tây Hồ, Hà Nội', phone: '0909012345', email: 'thaovy@example.com', className: '11A1', guardian: 'Nguyễn Đức Thành', status: 'Đang học' },
  { id: 'HS010', name: 'Hoàng Nhật Minh', birthYear: '2009', hometown: 'Quảng Ninh', gender: 'Nam', ethnicity: 'Kinh', address: 'Nam Từ Liêm, Hà Nội', phone: '0910123456', email: 'nhatminh@example.com', className: '11A2', guardian: 'Hoàng Thị Hạnh', status: 'Đang học' },
  { id: 'HS011', name: 'Phan Bảo Ngọc', birthYear: '2009', hometown: 'Huế', gender: 'Nữ', ethnicity: 'Kinh', address: 'Thanh Xuân, Hà Nội', phone: '0911234567', email: 'baongoc@example.com', className: '11A2', guardian: 'Phan Văn Long', status: 'Đang học' },
  { id: 'HS012', name: 'Đinh Quang Vinh', birthYear: '2009', hometown: 'Hà Nội', gender: 'Nam', ethnicity: 'Kinh', address: 'Hà Đông, Hà Nội', phone: '0912345678', email: 'quangvinh@example.com', className: '11A2', guardian: 'Đinh Thị Hồng', status: 'Đang học' },
];

const storageKey = 'akademi.students';
const enrollmentStorageKey = 'akademi.student-enrollments';

const readStudentProfiles = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? initialStudents;
  } catch {
    return initialStudents;
  }
};

const readEnrollments = () => {
  try {
    const stored = localStorage.getItem(enrollmentStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    return [];
  }

  const legacyStudents = readStudentProfiles();
  const currentClasses = getRecords('classes').filter((item) => item.schoolYear === defaultSchoolYear);
  const migratedEnrollments = legacyStudents
    .filter((student) => student.className)
    .map((student) => ({
      studentId: student.id,
      schoolYear: defaultSchoolYear,
      classId: currentClasses.find((item) => item.name === student.className)?.id ?? null,
      className: student.className,
    }));

  try {
    localStorage.setItem(enrollmentStorageKey, JSON.stringify(migratedEnrollments));
  } catch {
    return migratedEnrollments;
  }
  return migratedEnrollments;
};

export const getStudentEnrollments = (studentId) => {
  const enrollments = readEnrollments();
  return studentId
    ? enrollments.filter((enrollment) => enrollment.studentId === studentId)
    : enrollments;
};

export const assignStudentEnrollments = (assignments) => {
  const students = getStudents();
  const studentIds = new Set(students.map((student) => student.id));
  const assignmentKeys = new Set();
  for (const assignment of assignments) {
    const key = `${assignment.studentId}|${assignment.schoolYear}`;
    if (!studentIds.has(assignment.studentId) || !assignment.schoolYear || !assignment.className || assignmentKeys.has(key)) {
      return { saved: false, reason: 'invalid-assignment' };
    }
    assignmentKeys.add(key);
  }

  const enrollments = readEnrollments();
  const replacedKeys = new Set(assignments.map((assignment) => `${assignment.studentId}|${assignment.schoolYear}`));
  const nextEnrollments = [
    ...enrollments.filter((enrollment) => !replacedKeys.has(`${enrollment.studentId}|${enrollment.schoolYear}`)),
    ...assignments,
  ];
  try {
    localStorage.setItem(enrollmentStorageKey, JSON.stringify(nextEnrollments));
    return { saved: true };
  } catch {
    return { saved: false, reason: 'storage' };
  }
};

export const getStudents = (schoolYear = getCurrentSchoolYear()) => {
  const enrollments = readEnrollments().filter((enrollment) => enrollment.schoolYear === schoolYear);
  const enrollmentByStudent = new Map(enrollments.map((enrollment) => [enrollment.studentId, enrollment]));
  return readStudentProfiles().map((student) => ({
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
  const highestId = readStudentProfiles().reduce((highest, student) => {
    const match = /^HS(\d+)$/.exec(student.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `HS${String(highestId + 1).padStart(3, '0')}`;
};

export const createStudent = (newStudent, schoolYear = getCurrentSchoolYear()) => {
  const students = readStudentProfiles();
  const studentId = newStudent.id?.trim();

  if (!studentId || students.some((student) => student.id === studentId)) {
    return false;
  }

  const previousProfiles = localStorage.getItem(storageKey);
  try {
    localStorage.setItem(storageKey, JSON.stringify([
      ...students,
      { ...newStudent, id: studentId, status: 'Đang học' },
    ]));
    const matchingClass = getRecords('classes').find((item) => (
      item.schoolYear === schoolYear && item.name === newStudent.className?.trim()
    ));
    const enrollmentResult = assignStudentEnrollments([{
      studentId,
      schoolYear,
      classId: matchingClass?.id ?? null,
      className: newStudent.className?.trim() ?? '',
    }]);
    if (!enrollmentResult.saved) {
      if (previousProfiles == null) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, previousProfiles);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const saveStudent = (originalStudentId, updatedStudent) => {
  const students = readStudentProfiles();
  const studentIndex = students.findIndex((student) => student.id === originalStudentId);

  if (studentIndex === -1) {
    return false;
  }

  const hasDuplicateId = students.some((student) => (
    student.id === updatedStudent.id && student.id !== originalStudentId
  ));
  if (hasDuplicateId) {
    return false;
  }

  const studentProfile = { ...updatedStudent };
  delete studentProfile.classId;
  delete studentProfile.schoolYear;
  students[studentIndex] = studentProfile;
  try {
    localStorage.setItem(storageKey, JSON.stringify(students));
    return true;
  } catch {
    return false;
  }
};
