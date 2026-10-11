const yearsStorageKey = 'akademi.school-years';
const currentYearStorageKey = 'akademi.current-school-year';
export const defaultSchoolYear = '2026-2027';
const fallbackSchoolYears = [
  { id: 'sy-2025-2026', name: '2025-2026', isCurrent: false },
  { id: 'sy-2026-2027', name: defaultSchoolYear, isCurrent: true },
  { id: 'sy-2027-2028', name: '2027-2028', isCurrent: false },
  { id: 'sy-2028-2029', name: '2028-2029', isCurrent: false },
  { id: 'sy-2029-2030', name: '2029-2030', isCurrent: false },
];
let backendSchoolYears = [];
let backendCurrentSchoolYear = null;
let initializationPromise;

const yearStart = (schoolYear) => Number(/^([0-9]{4})-[0-9]{4}$/.exec(schoolYear)?.[1] ?? 0);

const readLocalSchoolYears = () => {
  try {
    const savedYears = JSON.parse(localStorage.getItem(yearsStorageKey));
    return Array.isArray(savedYears) ? savedYears : [];
  } catch {
    return [];
  }
};

const normalizeApiSchoolYears = (payload) => {
  const records = payload?.data?.data ?? payload?.data ?? payload;
  const flattenRecords = (value) => {
    if (Array.isArray(value)) return value.flatMap(flattenRecords);
    if (!value || typeof value !== 'object') return [];
    if (typeof value.name === 'string' && /^\d{4}-\d{4}$/.test(value.name)) return [value];
    return Object.values(value).flatMap(flattenRecords);
  };

  return flattenRecords(records).map((record) => ({
    _id: String(record._id ?? record.id ?? `sy-${record.name}`),
    id: String(record._id ?? record.id ?? `sy-${record.name}`),
    name: record.name,
    startDate: record.startDate ?? null,
    endDate: record.endDate ?? null,
    isCurrent: record.isCurrent === true,
    status: record.status ?? 'planned',
  }));
};

export const initializeSchoolYears = () => {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const apiUrl = import.meta.env.VITE_SCHOOL_YEARS_API_URL;
    if (!apiUrl) return getSchoolYears();

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`School year API returned ${response.status}`);
      const payload = await response.json();
      const records = normalizeApiSchoolYears(payload);
      if (!records.length) throw new Error('School year API returned no valid records');

      backendSchoolYears = records;
      backendCurrentSchoolYear = records.find((record) => record.isCurrent)?.name ?? null;
    } catch (error) {
      console.error('Could not load school years from API; using local fallback.', error);
    }

    return getSchoolYears();
  })();

  return initializationPromise;
};

export const getSchoolYears = () => {
  const localYears = readLocalSchoolYears();
  const names = new Set([
    ...(backendSchoolYears.length ? backendSchoolYears.map((record) => record.name) : fallbackSchoolYears.map((record) => record.name)),
    ...localYears,
  ]);
  return [...names].sort((left, right) => yearStart(left) - yearStart(right));
};

export const getCurrentSchoolYear = () => {
  const years = getSchoolYears();
  if (backendCurrentSchoolYear && years.includes(backendCurrentSchoolYear)) {
    return backendCurrentSchoolYear;
  }
  try {
    const currentYear = localStorage.getItem(currentYearStorageKey);
    if (years.includes(currentYear)) return currentYear;
  } catch {
    return defaultSchoolYear;
  }
  return years.includes(defaultSchoolYear) ? defaultSchoolYear : years[0] ?? defaultSchoolYear;
};

const updateApiRecord = async (record) => {
  const updateTemplate = import.meta.env.VITE_SCHOOL_YEARS_UPDATE_URL;
  if (!updateTemplate) return { updated: false, reason: 'missing-update-url' };
  const recordId = record._id ?? record.id;
  if (!recordId) return { updated: false, reason: 'missing-record-id' };

  try {
    const updateUrl = new URL(updateTemplate);
    updateUrl.pathname = updateUrl.pathname.replace(/\/dataID\/?$/, `/${encodeURIComponent(recordId)}`);
    const apiRecord = { ...record };
    delete apiRecord.id;
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apiRecord, _id: recordId }),
    });
    if (!response.ok) {
      const responseText = await response.text();
      let detail = responseText;
      try {
        detail = JSON.parse(responseText)?.message ?? responseText;
      } catch {
        detail = responseText;
      }
      return { updated: false, reason: `http-${response.status}`, detail };
    }
    return { updated: true };
  } catch (error) {
    console.error('Could not update school year in API.', error);
    return { updated: false, reason: 'network' };
  }
};

export const setCurrentSchoolYear = async (schoolYear) => {
  if (!getSchoolYears().includes(schoolYear)) return false;

  const backendTarget = backendSchoolYears.find((record) => record.name === schoolYear);
  if (backendSchoolYears.length && !backendTarget) {
    return { success: false, reason: 'year-not-in-api' };
  }

  if (backendTarget) {
    const changedRecords = backendSchoolYears.filter((record) => (
      record.isCurrent !== (record.name === schoolYear)
    ));
    const originalRecords = changedRecords.map((record) => ({ ...record }));
    const updatedRecords = [];

    for (const record of changedRecords) {
      const updatedRecord = { ...record, isCurrent: record.name === schoolYear };
      const result = await updateApiRecord(updatedRecord);
      if (!result.updated) {
        for (const originalRecord of updatedRecords.reverse()) {
          await updateApiRecord(originalRecord);
        }
        for (const originalRecord of originalRecords) {
          const cachedRecord = backendSchoolYears.find((item) => item.id === originalRecord.id);
          if (cachedRecord) Object.assign(cachedRecord, originalRecord);
        }
        return { success: false, reason: result.reason, detail: result.detail };
      }
      updatedRecords.push(originalRecords.find((original) => original.id === record.id));
      Object.assign(record, updatedRecord);
    }
    backendCurrentSchoolYear = schoolYear;
  }

  try {
    localStorage.setItem(currentYearStorageKey, schoolYear);
    return { success: true, synced: Boolean(backendTarget) };
  } catch {
    return backendTarget
      ? { success: true, synced: true }
      : { success: false, reason: 'storage' };
  }
};

export const createNextSchoolYear = async () => {
  const years = getSchoolYears();
  const lastYear = years.at(-1);
  const match = /^([0-9]{4})-([0-9]{4})$/.exec(lastYear ?? '');
  if (!match) return { created: false, reason: 'invalid-year' };

  const newYear = `${Number(match[1]) + 1}-${Number(match[2]) + 1}`;
  if (years.includes(newYear)) return { created: false, reason: 'exists', schoolYear: newYear };

  const apiUrl = import.meta.env.VITE_SCHOOL_YEARS_API_URL;
  if (!apiUrl) return { created: false, reason: 'missing-api-url' };

  const newRecord = {
    name: newYear,
    startDate: `${newYear.slice(0, 4)}-09-01`,
    endDate: `${newYear.slice(5)}-05-31`,
    isCurrent: false,
    status: 'planned',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    });
    if (!response.ok) {
      const responseText = await response.text();
      let detail = responseText;
      try {
        detail = JSON.parse(responseText)?.message ?? responseText;
      } catch {
        detail = responseText;
      }
      return { created: false, reason: `http-${response.status}`, detail };
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    let createdRecord = normalizeApiSchoolYears(payload).find((record) => record.name === newYear);

    if (!createdRecord) {
      const listResponse = await fetch(apiUrl);
      if (listResponse.ok) {
        createdRecord = normalizeApiSchoolYears(await listResponse.json())
          .find((record) => record.name === newYear);
      }
    }

    if (!createdRecord?._id) {
      return { created: false, reason: 'missing-record-id', schoolYear: newYear };
    }

    backendSchoolYears = [
      ...backendSchoolYears.filter((record) => record.name !== newYear),
      createdRecord,
    ].sort((left, right) => yearStart(left.name) - yearStart(right.name));
    return { created: true, schoolYear: newYear };
  } catch (error) {
    console.error('Could not create school year through API.', error);
    return { created: false, reason: 'network', detail: error.message };
  }
};

export const getSchoolYearNameById = (schoolYearId) => (
  backendSchoolYears.find((record) => record._id === schoolYearId || record.id === schoolYearId)?.name
  ?? fallbackSchoolYears.find((record) => record.id === schoolYearId)?.name
);

export const getSchoolYearIdByName = (schoolYear) => (
  backendSchoolYears.find((record) => record.name === schoolYear)?._id
  ?? backendSchoolYears.find((record) => record.name === schoolYear)?.id
);