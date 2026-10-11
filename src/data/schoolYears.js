import {
  createResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from './apiClient';

const currentYearStorageKey = 'akademi.current-school-year';
const yearStart = (schoolYear) => Number(/^([0-9]{4})-[0-9]{4}$/.exec(schoolYear)?.[1] ?? 0);

const normalizeSchoolYear = (record) => ({
  ...record,
  _id: String(record._id ?? record.id ?? ''),
  id: String(record._id ?? record.id ?? record.schoolYearKey ?? ''),
  name: record.name ?? '',
  isCurrent: record.isCurrent === true,
  status: record.status ?? 'planned',
});

export const initializeSchoolYears = () => Promise.resolve(getSchoolYears());

export const getSchoolYears = () => [...new Set(getResourceRecords('schoolYears')
  .map((record) => record.name)
  .filter((name) => /^\d{4}-\d{4}$/.test(name)))]
  .sort((left, right) => yearStart(left) - yearStart(right));

export const getCurrentSchoolYear = () => {
  const years = getSchoolYears();
  const serverYear = getResourceRecords('schoolYears').find((record) => record.isCurrent)?.name;
  if (serverYear && years.includes(serverYear)) return serverYear;
  try {
    const preference = localStorage.getItem(currentYearStorageKey);
    if (years.includes(preference)) return preference;
  } catch {
    return years[0] ?? '';
  }
  return years[0] ?? '';
};

export const setCurrentSchoolYear = async (schoolYear) => {
  const records = getResourceRecords('schoolYears').map(normalizeSchoolYear);
  const target = records.find((record) => record.name === schoolYear);
  if (!target) return { success: false, reason: 'year-not-found' };

  const changes = records.filter((record) => record.isCurrent !== (record.name === schoolYear));
  const completed = [];
  for (const record of changes) {
    try {
      await updateResourceRecord('schoolYears', {
        ...record,
        isCurrent: record.name === schoolYear,
      });
      completed.push(record);
    } catch (error) {
      return { success: false, reason: 'partial-failure', error, completed };
    }
  }

  try {
    localStorage.setItem(currentYearStorageKey, schoolYear);
  } catch {
    return { success: true, synced: true, preferenceSaved: false };
  }
  return { success: true, synced: true };
};

export const createNextSchoolYear = async () => {
  const years = getSchoolYears();
  const match = /^([0-9]{4})-([0-9]{4})$/.exec(years.at(-1) ?? '');
  if (!match) return { created: false, reason: 'invalid-year' };
  const schoolYear = `${Number(match[1]) + 1}-${Number(match[2]) + 1}`;
  if (years.includes(schoolYear)) return { created: false, reason: 'exists', schoolYear };

  try {
    const record = await createResourceRecord('schoolYears', {
      schoolYearKey: `SY-${schoolYear}`,
      name: schoolYear,
      startDate: `${schoolYear.slice(0, 4)}-09-01`,
      endDate: `${schoolYear.slice(5)}-05-31`,
      isCurrent: false,
      status: 'planned',
    });
    return { created: true, schoolYear, record };
  } catch (error) {
    return { created: false, reason: 'api', error, schoolYear };
  }
};

export const getSchoolYearNameById = (schoolYearId) => (
  getResourceRecords('schoolYears')
    .find((record) => String(record._id ?? record.id) === String(schoolYearId))?.name
);

export const getSchoolYearIdByName = (schoolYear) => (
  getResourceRecords('schoolYears').find((record) => record.name === schoolYear)?._id
  ?? getResourceRecords('schoolYears').find((record) => record.name === schoolYear)?.id
);
