import {
  createResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from './apiClient';

const readActivities = () => getResourceRecords('activities').map((item) => ({
  ...item,
  id: String(item.activityKey ?? item.id ?? item._id ?? ''),
}));

const nextActivityId = (activities) => {
  const highestId = activities.reduce((highest, activity) => {
    const match = /^HD(\d+)$/.exec(activity.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `HD${String(highestId + 1).padStart(3, '0')}`;
};

const emptyParticipants = () => ({ classes: [], students: [], teachers: [], staff: [] });

export const getActivities = () => readActivities().sort((left, right) => (
  new Date(left.startAt) - new Date(right.startAt)
));

export const getActivityById = (activityId) => readActivities().find((item) => item.id === activityId);

export const createActivity = async (activity) => {
  try {
    return await createResourceRecord('activities', {
      ...activity,
      id: nextActivityId(readActivities()),
      participants: emptyParticipants(),
    });
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const updateActivity = async (activityId, updates) => {
  const activity = readActivities().find((item) => item.id === activityId);
  if (!activity) return { saved: false, reason: 'not-found' };
  try {
    await updateResourceRecord('activities', { ...activity, ...updates });
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const addActivityParticipants = async (activityId, role, entries) => {
  const activity = readActivities().find((item) => item.id === activityId);
  if (!activity || !['classes', 'students', 'teachers', 'staff'].includes(role)) {
    return { added: 0, reason: 'not-found' };
  }
  if (role === 'students' && !activity.registrationOpen) return { added: 0, reason: 'registration-closed' };

  const participants = { ...emptyParticipants(), ...activity.participants };
  const current = participants[role];
  const currentIds = new Set(current.map((entry) => entry.id));
  const added = entries.filter((entry) => !currentIds.has(entry.id));
  const capacity = Number(activity.capacity) || 0;
  if (role === 'students' && capacity > 0 && current.length + added.length > capacity) {
    return { added: 0, reason: 'capacity' };
  }
  if (!added.length) return { added: 0, reason: 'duplicate' };
  participants[role] = [...current, ...added];
  try {
    await updateResourceRecord('activities', { ...activity, participants });
    return { added: added.length };
  } catch (error) {
    return { added: 0, reason: 'api', error };
  }
};

export const removeActivityParticipant = async (activityId, role, participantId) => {
  const activity = readActivities().find((item) => item.id === activityId);
  if (!activity?.participants?.[role]) return { saved: false, reason: 'not-found' };
  const participants = {
    ...emptyParticipants(),
    ...activity.participants,
    [role]: activity.participants[role].filter((item) => item.id !== participantId),
  };
  try {
    await updateResourceRecord('activities', { ...activity, participants });
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};
