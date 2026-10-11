import { getStudents, assignStudentEnrollments, getStudentEnrollments } from './students';
import { createRecordsBatch, getRecords } from './schoolRecords';
import {
  createResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from './apiClient';

const readPlans = () => getResourceRecords('promotionPlans').map((item) => ({
  ...item,
  id: String(item.promotionPlanKey ?? item.id ?? item._id ?? ''),
}));

const parseClassName = (className) => {
  const match = /^(\d+)(.*)$/.exec(className ?? '');
  return match ? { grade: Number(match[1]), section: match[2] } : null;
};

const nextSchoolYear = (schoolYear) => {
  const match = /^(\d{4})-(\d{4})$/.exec(schoolYear);
  return match ? `${Number(match[1]) + 1}-${Number(match[2]) + 1}` : null;
};

export const getPromotionPlans = () => readPlans().sort((left, right) => (
  new Date(right.createdAt) - new Date(left.createdAt)
));

export const getPromotionPlan = (planId) => readPlans().find((plan) => plan.id === planId);

export const createPromotionPlan = async (sourceYear) => {
  const targetYear = nextSchoolYear(sourceYear);
  if (!targetYear) return { saved: false, reason: 'invalid-year' };

  const plans = readPlans();
  if (plans.some((plan) => plan.sourceYear === sourceYear && plan.targetYear === targetYear && plan.status === 'pending')) {
    return { saved: false, reason: 'pending-exists' };
  }

  const allClasses = getRecords('classes');
  const sourceClasses = allClasses.filter((item) => item.schoolYear === sourceYear);
  const targetClasses = allClasses.filter((item) => item.schoolYear === targetYear);
  const students = getStudents(sourceYear);
  const enrollments = getStudentEnrollments();
  const sourceClassByStudent = new Map(enrollments
    .filter((enrollment) => enrollment.schoolYear === sourceYear)
    .map((enrollment) => [enrollment.studentId, enrollment]));

  const rows = students.map((student) => {
    const enrollment = sourceClassByStudent.get(student.id);
    const sourceClassName = enrollment?.className ?? student.className;
    const sourceClass = sourceClasses.find((item) => item.id === enrollment?.classId)
      ?? sourceClasses.find((item) => item.name === sourceClassName);
    const parsedClass = parseClassName(sourceClassName);
    const suggestedGrade = parsedClass ? parsedClass.grade + 1 : null;
    const suggestedName = parsedClass && parsedClass.grade < 12
      ? `${suggestedGrade}${parsedClass.section}`
      : '';
    const exactTarget = targetClasses.find((item) => item.name === suggestedName);
    const targetByGrade = targetClasses.find((item) => Number(item.grade) === suggestedGrade);
    const isActive = student.status === 'Đang học';
    const isGraduating = parsedClass?.grade >= 12;
    const action = !isActive ? 'hold' : isGraduating ? 'graduate' : 'promote';
    const targetClass = exactTarget ?? targetByGrade;

    return {
      studentId: student.id,
      studentName: student.name,
      studentStatus: student.status,
      sourceClassId: sourceClass?.id ?? enrollment?.classId ?? null,
      sourceClassName,
      action,
      targetClassKey: action === 'promote'
        ? targetClass?.id ?? (suggestedName ? `new:${suggestedName}` : '')
        : '',
      suggestedClassName: suggestedName,
      suggestedGrade,
      targetCapacity: sourceClass?.capacity ?? 40,
    };
  }).filter((row) => row.sourceClassName);

  const highestId = plans.reduce((highest, plan) => {
    const match = /^PROMO(\d+)$/.exec(plan.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  const plan = {
    id: `PROMO${String(highestId + 1).padStart(4, '0')}`,
    sourceYear,
    targetYear,
    status: 'pending',
    createdAt: new Date().toISOString(),
    rows,
  };

  try {
    const created = await createResourceRecord('promotionPlans', plan);
    return { saved: true, plan: created };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const updatePromotionPlanRows = async (planId, rows) => {
  const plans = readPlans();
  const planIndex = plans.findIndex((plan) => plan.id === planId && plan.status === 'pending');
  if (planIndex < 0) return false;

  const originalRows = new Map(plans[planIndex].rows.map((row) => [row.studentId, row]));
  if (rows.length !== originalRows.size || rows.some((row) => !originalRows.has(row.studentId))) return false;
  const plan = plans[planIndex];
  const next = { ...plan, rows: rows.map((row) => ({ ...originalRows.get(row.studentId), ...row })) };
  try {
    await updateResourceRecord('promotionPlans', next);
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const rejectPromotionPlan = async (planId) => {
  const plan = readPlans().find((item) => item.id === planId && item.status === 'pending');
  if (!plan) return { saved: false, reason: 'not-pending' };
  try {
    await updateResourceRecord('promotionPlans', {
      ...plan,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
    });
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const approvePromotionPlan = async (planId) => {
  const plan = readPlans().find((item) => item.id === planId && item.status === 'pending');
  if (!plan) return { saved: false, reason: 'not-pending' };

  const allClasses = getRecords('classes');
  const targetClasses = allClasses.filter((item) => item.schoolYear === plan.targetYear);
  const targetById = new Map(targetClasses.map((item) => [item.id, item]));
  const newClassNames = [...new Set(plan.rows
    .filter((row) => row.action === 'promote' && row.targetClassKey.startsWith('new:'))
    .map((row) => row.targetClassKey.slice(4)))]
    .filter((name) => !targetClasses.some((item) => item.name === name));
  const nextIds = () => {
    const highestId = allClasses.reduce((highest, item) => {
      const match = /^LH(\d+)$/.exec(item.id);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return newClassNames.map((_, index) => `LH${String(highestId + index + 1).padStart(3, '0')}`);
  };
  const proposedClasses = newClassNames.map((name, index) => {
    const matchingRows = plan.rows.filter((row) => row.action === 'promote' && row.targetClassKey === `new:${name}`);
    const sourceClass = allClasses.find((item) => item.id === matchingRows[0]?.sourceClassId)
      ?? allClasses.find((item) => item.name === matchingRows[0]?.sourceClassName && item.schoolYear === plan.sourceYear);
    const parsedName = parseClassName(name);
    return {
      ...(sourceClass ?? {}),
      id: nextIds()[index],
      name,
      grade: String(parsedName?.grade ?? Number(sourceClass?.grade ?? 0) + 1),
      schoolYear: plan.targetYear,
      capacity: sourceClass?.capacity ?? 40,
    };
  });
  const newIdByName = new Map([
    ...targetClasses.map((item) => [item.name, item.id]),
    ...proposedClasses.map((item) => [item.name, item.id]),
  ]);

  const capacityCounts = new Map();
  for (const row of plan.rows.filter((item) => item.action === 'promote')) {
    const classId = row.targetClassKey.startsWith('new:')
      ? newIdByName.get(row.targetClassKey.slice(4))
      : row.targetClassKey;
    const targetClass = targetById.get(classId) ?? proposedClasses.find((item) => item.id === classId);
    if (!targetClass) return { saved: false, reason: 'invalid-target' };
    capacityCounts.set(classId, (capacityCounts.get(classId) ?? 0) + 1);
  }
  for (const [classId, proposedCount] of capacityCounts) {
    const targetClass = targetById.get(classId) ?? proposedClasses.find((item) => item.id === classId);
    const planStudentIds = new Set(plan.rows.map((row) => row.studentId));
    const existingCount = getStudentEnrollments()
      .filter((enrollment) => (
        enrollment.schoolYear === plan.targetYear
        && enrollment.classId === classId
        && !planStudentIds.has(enrollment.studentId)
      ))
      .length;
    if (Number(targetClass.capacity) > 0 && existingCount + proposedCount > Number(targetClass.capacity)) {
      return { saved: false, reason: 'capacity', className: targetClass.name };
    }
  }

  const created = await createRecordsBatch('classes', proposedClasses);
  if (!created.saved) {
    return {
      saved: false,
      reason: 'partial-failure',
      stage: 'classes',
      error: created.error,
      completed: created.records,
    };
  }
  const createdClassesByName = new Map(created.records.map((item) => [item.name, item]));

  const assignments = plan.rows.filter((row) => row.action === 'promote').map((row) => {
    const classId = row.targetClassKey.startsWith('new:')
      ? newIdByName.get(row.targetClassKey.slice(4))
      : row.targetClassKey;
    const targetClass = targetById.get(classId)
      ?? createdClassesByName.get(row.targetClassKey.slice(4))
      ?? proposedClasses.find((item) => item.id === classId);
    return {
      studentId: row.studentId,
      schoolYear: plan.targetYear,
      classId: targetClass._id ?? targetClass.id,
      className: targetClass.name,
    };
  });
  const assignmentResult = await assignStudentEnrollments(assignments);
  if (!assignmentResult.saved) {
    return {
      saved: false,
      reason: 'partial-failure',
      stage: 'enrollments',
      error: assignmentResult.error,
      completed: assignmentResult.completed,
      classesCreated: created.records,
    };
  }

  try {
    await updateResourceRecord('promotionPlans', {
      ...plan,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
    });
  } catch (error) {
    return {
      saved: false,
      reason: 'partial-failure',
      stage: 'plan',
      error,
      assignments: assignments.length,
      classesCreated: created.records.length,
    };
  }
  return { saved: true, assignments: assignments.length, classesCreated: proposedClasses.length };
};