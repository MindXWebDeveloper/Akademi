import { getResourceRecords } from './apiClient';

export const roleDefinitions = [
  { roleKey: 'principal', name: 'Ban Giám Hiệu' },
  { roleKey: 'teacher', name: 'Giáo viên' },
  { roleKey: 'student', name: 'Học sinh' },
];

export const hideableMenus = [
  { key: 'students', label: 'Quản lý học sinh' },
  { key: 'class-promotions', label: 'Sắp lớp' },
  { key: 'teachers', label: 'Quản lý giáo viên' },
  { key: 'classes', label: 'Quản lý lớp học' },
  { key: 'timetable', label: 'Thời khóa biểu' },
  { key: 'activities', label: 'Hoạt động ngoài khóa' },
  { key: 'notices', label: 'Thông báo' },
  { key: 'library', label: 'Thư viện' },
];

export const getRoleRecord = (roleKey) => getResourceRecords('roles')
  .find((role) => role.roleKey === roleKey);

export const getMenuAccess = (roleKey, menuKey) => {
  const role = getRoleRecord(roleKey);
  const configuredAccess = role?.menuAccess?.[menuKey];
  if (['hide', 'read', 'edit'].includes(configuredAccess)) return configuredAccess;

  if (Array.isArray(role?.hiddenMenus)) {
    return role.hiddenMenus.includes(menuKey) ? 'hide' : 'edit';
  }
  return 'hide';
};
