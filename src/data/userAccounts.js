import { createResourceRecord, getResourceRecords } from './apiClient';

const normalizeUsernamePart = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[đĐ]/g, (letter) => (letter === 'Đ' ? 'D' : 'd'))
  .toLocaleLowerCase('en')
  .replace(/[^a-z0-9]/g, '');

export const createUsernameFromName = (fullName) => {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const givenName = normalizeUsernamePart(nameParts.at(-1) ?? '');
  const initials = nameParts.slice(0, -1)
    .map(normalizeUsernamePart)
    .filter(Boolean)
    .map((part) => part[0])
    .join('');
  const baseUsername = `${givenName}${initials}`;
  const usernames = new Set(getResourceRecords('users').map((user) => (
    user.username?.trim().toLocaleLowerCase('en')
  )));

  if (!usernames.has(baseUsername)) return baseUsername;
  let suffix = 1;
  while (usernames.has(`${baseUsername}${suffix}`)) suffix += 1;
  return `${baseUsername}${suffix}`;
};

export const createLinkedUserAccount = async ({ role, profileKey, fullName, username = createUsernameFromName(fullName) }) => {
  const isTeacher = role === 'teacher';
  const user = {
    accountKey: `ACC-${profileKey}`,
    username,
    password: profileKey,
    role,
    teacherKey: isTeacher ? profileKey : null,
    studentKey: isTeacher ? null : profileKey,
    isActive: true,
  };
  const created = await createResourceRecord('users', user);
  return { created, username, password: profileKey };
};
