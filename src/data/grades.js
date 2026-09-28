const storageKey = 'akademi.grades';
const transcriptStorageKey = 'akademi.student-transcripts';

export const gradeWeights = {
  oralScores: 1,
  shortTestScores: 1,
  onePeriodScores: 1,
  midtermScore: 2,
  finalScore: 3,
};

const makeConfigKey = (subject, schoolYear, semester) => (
  [subject, schoolYear, semester].map((part) => encodeURIComponent(part)).join('|')
);

const makeRecordKey = (studentId, subject, schoolYear, semester) => (
  [studentId, subject, schoolYear, semester].map((part) => encodeURIComponent(part)).join('|')
);

const makeTranscriptKey = (studentId, schoolYear) => (
  [studentId, schoolYear].map((part) => encodeURIComponent(part)).join('|')
);

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? { configs: {}, records: {} };
  } catch {
    return { configs: {}, records: {} };
  }
};

const writeStore = (store) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
};

export const getGradeConfig = (subject, schoolYear, semester) => {
  const store = readStore();
  return store.configs[makeConfigKey(subject, schoolYear, semester)] ?? {
    oralCount: 2,
    shortTestCount: 2,
    onePeriodCount: 1,
  };
};

export const saveGradeConfig = (subject, schoolYear, semester, config) => {
  const store = readStore();
  store.configs[makeConfigKey(subject, schoolYear, semester)] = config;
  return writeStore(store);
};

export const getGradeRecord = (studentId, subject, schoolYear, semester) => {
  const store = readStore();
  return store.records[makeRecordKey(studentId, subject, schoolYear, semester)] ?? {
    oralScores: [],
    shortTestScores: [],
    onePeriodScores: [],
    midtermScore: null,
    finalScore: null,
  };
};

export const saveGradeRecord = (studentId, subject, schoolYear, semester, record) => {
  const store = readStore();
  store.records[makeRecordKey(studentId, subject, schoolYear, semester)] = record;
  return writeStore(store);
};

export const getStudentTranscript = (studentId, schoolYear) => {
  try {
    const store = JSON.parse(localStorage.getItem(transcriptStorageKey)) ?? {};
    return store[makeTranscriptKey(studentId, schoolYear)] ?? {
      academicLevel: '',
      conduct: '',
      homeroomComment: '',
    };
  } catch {
    return { academicLevel: '', conduct: '', homeroomComment: '' };
  }
};

export const saveStudentTranscript = (studentId, schoolYear, transcript) => {
  let store = {};
  try {
    store = JSON.parse(localStorage.getItem(transcriptStorageKey)) ?? {};
  } catch {
    store = {};
  }

  store[makeTranscriptKey(studentId, schoolYear)] = transcript;
  try {
    localStorage.setItem(transcriptStorageKey, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
};

export const averageScores = (scores) => {
  const validScores = scores.filter((score) => Number.isFinite(Number(score)) && score !== null && score !== '');
  if (!validScores.length) return null;

  const average = validScores.reduce((total, score) => total + Number(score), 0) / validScores.length;
  return Math.round((average + Number.EPSILON) * 100) / 100;
};

export const completeGroupAverage = (scores, count) => {
  if (count === 0) return null;
  if (!Array.isArray(scores) || scores.length < count) return null;
  const requiredScores = scores.slice(0, count);
  if (requiredScores.some((score) => score == null || score === '' || !Number.isFinite(Number(score)))) {
    return null;
  }
  return averageScores(requiredScores);
};

export const getSemesterAverage = (record, config) => {
  const components = [
    { key: 'oralScores', scores: record.oralScores, count: config.oralCount, weight: gradeWeights.oralScores },
    { key: 'shortTestScores', scores: record.shortTestScores, count: config.shortTestCount, weight: gradeWeights.shortTestScores },
    { key: 'onePeriodScores', scores: record.onePeriodScores, count: config.onePeriodCount, weight: gradeWeights.onePeriodScores },
    { key: 'midtermScore', score: record.midtermScore, weight: gradeWeights.midtermScore },
    { key: 'finalScore', score: record.finalScore, weight: gradeWeights.finalScore },
  ];

  const weightedScores = [];
  for (const component of components) {
    if ('scores' in component) {
      if (component.count === 0) continue;
      const groupAverage = completeGroupAverage(component.scores, component.count);
      if (groupAverage == null) {
        return null;
      }

      weightedScores.push({
        score: groupAverage,
        weight: component.weight,
      });
      continue;
    }

    if (component.score == null || component.score === '' || !Number.isFinite(Number(component.score))) {
      return null;
    }
    weightedScores.push({ score: Number(component.score), weight: component.weight });
  }

  const totalWeight = weightedScores.reduce((total, item) => total + item.weight, 0);
  if (!totalWeight) return null;

  const weightedAverage = weightedScores.reduce((total, item) => (
    total + item.score * item.weight
  ), 0) / totalWeight;
  return Math.round((weightedAverage + Number.EPSILON) * 100) / 100;
};

export const getAnnualAverage = (firstSemesterAverage, secondSemesterAverage) => {
  if (firstSemesterAverage == null || secondSemesterAverage == null) return null;
  return Math.round(((firstSemesterAverage + (2 * secondSemesterAverage)) / 3 + Number.EPSILON) * 100) / 100;
};
