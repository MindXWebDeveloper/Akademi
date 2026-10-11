import {
  createResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from './apiClient';
import { getSubjectByName } from './subjects';

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

const gradeRows = () => getResourceRecords('grades').map((item) => ({
  ...item,
  id: String(item.gradeKey ?? item.id ?? item._id ?? ''),
}));

export const getGradeConfig = (subject, schoolYear, semester) => {
  const subjectKey = getSubjectByName(subject)?.id;
  const key = makeConfigKey(subject, schoolYear, semester);
  return gradeRows().find((item) => (
    item.type === 'config'
    && ((subjectKey && String(item.subjectKey) === subjectKey && item.schoolYear === schoolYear && String(item.semester) === String(semester))
      || item.key === key)
  )) ?? {
    oralCount: 2,
    shortTestCount: 2,
    onePeriodCount: 1,
  };
};

export const saveGradeConfig = async (subject, schoolYear, semester, config) => {
  const subjectRecord = getSubjectByName(subject);
  if (!subjectRecord) return { saved: false, reason: 'subject-not-found' };
  const key = makeConfigKey(subject, schoolYear, semester);
  const current = gradeRows().find((item) => (
    item.type === 'config'
    && ((String(item.subjectKey) === subjectRecord.id && item.schoolYear === schoolYear && String(item.semester) === String(semester))
      || item.key === key)
  ));
  try {
    const row = {
      ...current,
      ...config,
      id: current?.id ?? `config|${key}`,
      type: 'config',
      key,
      subjectKey: subjectRecord.id,
      subject,
      schoolYear,
      semester,
    };
    if (current) await updateResourceRecord('grades', row);
    else await createResourceRecord('grades', row);
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const getGradeRecord = (studentId, subject, schoolYear, semester) => {
  const subjectKey = getSubjectByName(subject)?.id;
  const key = makeRecordKey(studentId, subject, schoolYear, semester);
  return gradeRows().find((item) => (
    item.type === 'record'
    && ((subjectKey && String(item.subjectKey) === subjectKey && item.studentId === studentId && item.schoolYear === schoolYear && String(item.semester) === String(semester))
      || item.key === key)
  )) ?? {
    oralScores: [],
    shortTestScores: [],
    onePeriodScores: [],
    midtermScore: null,
    finalScore: null,
  };
};

export const saveGradeRecord = async (studentId, subject, schoolYear, semester, record) => {
  const subjectRecord = getSubjectByName(subject);
  if (!subjectRecord) return { saved: false, reason: 'subject-not-found' };
  const key = makeRecordKey(studentId, subject, schoolYear, semester);
  const current = gradeRows().find((item) => (
    item.type === 'record'
    && ((String(item.subjectKey) === subjectRecord.id && item.studentId === studentId && item.schoolYear === schoolYear && String(item.semester) === String(semester))
      || item.key === key)
  ));
  try {
    const row = {
      ...current,
      ...record,
      id: current?.id ?? `record|${key}`,
      type: 'record',
      key,
      subjectKey: subjectRecord.id,
      studentId,
      subject,
      schoolYear,
      semester,
    };
    if (current) await updateResourceRecord('grades', row);
    else await createResourceRecord('grades', row);
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const getStudentTranscript = (studentId, schoolYear) => {
  const key = makeTranscriptKey(studentId, schoolYear);
  return getResourceRecords('transcripts').find((item) => item.key === key) ?? {
    academicLevel: '',
    conduct: '',
    homeroomComment: '',
  };
};

export const saveStudentTranscript = async (studentId, schoolYear, transcript) => {
  const key = makeTranscriptKey(studentId, schoolYear);
  const current = getResourceRecords('transcripts').find((item) => item.key === key);
  try {
    const row = { ...current, ...transcript, id: current?.id ?? key, key, studentId, schoolYear };
    if (current) await updateResourceRecord('transcripts', row);
    else await createResourceRecord('transcripts', row);
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
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
