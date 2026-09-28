const storageKey = 'akademi.extracurricular-activities';

const readActivities = () => {
  try {
    const activities = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(activities) ? activities : [];
  } catch {
    return [];
  }
};

const writeActivities = (activities) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(activities));
    return true;
  } catch {
    return false;
  }
};

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

export const getActivityById = (activityId) => (
  readActivities().find((activity) => activity.id === activityId)
);

export const createActivity = (activity) => {
  const activities = readActivities();
  const newActivity = {
    ...activity,
    id: nextActivityId(activities),
    participants: emptyParticipants(),
  };

  return writeActivities([...activities, newActivity]) ? newActivity : null;
};

export const updateActivity = (activityId, updates) => {
  const activities = readActivities();
  const activityIndex = activities.findIndex((activity) => activity.id === activityId);
  if (activityIndex < 0) return false;

  activities[activityIndex] = { ...activities[activityIndex], ...updates };
  return writeActivities(activities);
};

export const addActivityParticipants = (activityId, role, entries) => {
  const activities = readActivities();
  const activity = activities.find((item) => item.id === activityId);
  if (!activity || !['classes', 'students', 'teachers', 'staff'].includes(role)) {
    return { added: 0, reason: 'not-found' };
  }

  if (role === 'students' && !activity.registrationOpen) {
    return { added: 0, reason: 'registration-closed' };
  }

  const participants = { ...emptyParticipants(), ...activity.participants };
  const currentEntries = participants[role];
  const existingIds = new Set(currentEntries.map((entry) => entry.id));
  const newEntries = entries.filter((entry) => !existingIds.has(entry.id));
  const studentCapacity = Number(activity.capacity) || 0;
  if (role === 'students' && studentCapacity > 0 && currentEntries.length + newEntries.length > studentCapacity) {
    return { added: 0, reason: 'capacity' };
  }

  if (!newEntries.length) return { added: 0, reason: 'duplicate' };
  participants[role] = [...currentEntries, ...newEntries];
  activity.participants = participants;

  return writeActivities(activities)
    ? { added: newEntries.length }
    : { added: 0, reason: 'storage' };
};

export const removeActivityParticipant = (activityId, role, participantId) => {
  const activities = readActivities();
  const activity = activities.find((item) => item.id === activityId);
  if (!activity || !activity.participants?.[role]) return false;

  activity.participants[role] = activity.participants[role].filter((participant) => (
    participant.id !== participantId
  ));
  return writeActivities(activities);
};