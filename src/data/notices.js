import {
  createResourceRecord,
  deleteResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from './apiClient';

const readNotices = () => getResourceRecords('notices').map((item) => ({
  ...item,
  id: String(item.noticeKey ?? item.id ?? item._id ?? ''),
}));

export const getNotices = () => readNotices().sort((left, right) => (
  new Date(right.createdAt) - new Date(left.createdAt)
));

export const getNoticeById = (noticeId) => readNotices().find((notice) => notice.id === noticeId);

export const getActiveNotices = (now = new Date()) => {
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  return getNotices().filter((notice) => notice.startDate <= today && notice.endDate >= today);
};

export const createNotice = async (notice) => {
  const highestId = readNotices().reduce((highest, item) => {
    const match = /^TB(\d+)$/.exec(item.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  try {
    return await createResourceRecord('notices', {
      ...notice,
      id: `TB${String(highestId + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const updateNotice = async (noticeId, updates) => {
  const notice = readNotices().find((item) => item.id === noticeId);
  if (!notice) return { saved: false, reason: 'not-found' };
  try {
    await updateResourceRecord('notices', { ...notice, ...updates });
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const deleteNotice = async (noticeId) => {
  const notice = readNotices().find((item) => item.id === noticeId);
  if (!notice) return { saved: false, reason: 'not-found' };
  try {
    await deleteResourceRecord('notices', notice);
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};
