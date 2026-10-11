const storageKey = 'akademi.notices';

const readNotices = () => {
  try {
    const notices = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(notices) ? notices : [];
  } catch {
    return [];
  }
};

const writeNotices = (notices) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(notices));
    return true;
  } catch {
    return false;
  }
};

export const getNotices = () => readNotices().sort((left, right) => (
  new Date(right.createdAt) - new Date(left.createdAt)
));

export const getNoticeById = (noticeId) => readNotices().find((notice) => notice.id === noticeId);

export const getActiveNotices = (now = new Date()) => {
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  return getNotices().filter((notice) => notice.startDate <= today && notice.endDate >= today);
};

export const createNotice = (notice) => {
  const notices = readNotices();
  const highestId = notices.reduce((highest, item) => {
    const match = /^TB(\d+)$/.exec(item.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  const newNotice = {
    ...notice,
    id: `TB${String(highestId + 1).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
  };

  return writeNotices([...notices, newNotice]) ? newNotice : null;
};

export const updateNotice = (noticeId, updates) => {
  const notices = readNotices();
  const index = notices.findIndex((notice) => notice.id === noticeId);
  if (index < 0) return false;

  notices[index] = { ...notices[index], ...updates };
  return writeNotices(notices);
};

export const deleteNotice = (noticeId) => {
  const notices = readNotices();
  const nextNotices = notices.filter((notice) => notice.id !== noticeId);
  if (nextNotices.length === notices.length) return false;
  return writeNotices(nextNotices);
};