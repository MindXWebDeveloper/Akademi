import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { ClearOutlined, EditOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { getRecords } from '../../data/schoolRecords';
import {
  getLessons,
  getTimetableSettings,
  saveLesson,
  saveTimetableSettings,
} from '../../data/timetable';

const weekdays = [
  { key: 'monday', label: 'Thứ 2' },
  { key: 'tuesday', label: 'Thứ 3' },
  { key: 'wednesday', label: 'Thứ 4' },
  { key: 'thursday', label: 'Thứ 5' },
  { key: 'friday', label: 'Thứ 6' },
  { key: 'saturday', label: 'Thứ 7' },
];

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60) % 24;
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

const buildPeriods = (settings) => {
  let currentTime = timeToMinutes(settings.morningStart);

  return Array.from({ length: settings.periodCount }, (_, index) => {
    if (index === settings.morningPeriods) {
      currentTime = timeToMinutes(settings.afternoonStart);
    }

    const timing = settings.periods[index];
    const start = currentTime;
    const hasDuration = Number.isFinite(timing.duration) && timing.duration > 0;
    const end = hasDuration ? start + timing.duration : start;
    if (hasDuration) currentTime = end + timing.breakAfter;

    return {
      number: index + 1,
      session: index < settings.morningPeriods ? 'Sáng' : 'Chiều',
      time: hasDuration ? `${minutesToTime(start)} - ${minutesToTime(end)}` : null,
    };
  });
};

const Timetable = () => {
  const [viewMode, setViewMode] = useState('class');
  const [selectedId, setSelectedId] = useState();
  const [lessons, setLessons] = useState(getLessons);
  const [settings, setSettings] = useState(getTimetableSettings);
  const [draftSettings, setDraftSettings] = useState(getTimetableSettings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [form] = Form.useForm();
  const periods = useMemo(
    () => buildPeriods(settings).filter((period) => period.time),
    [settings],
  );
  const classes = getRecords('classes');
  const teachers = getRecords('teachers');
  const classOptions = classes.map((item) => ({ value: item.name, label: `${item.name} (${item.id})` }));
  const teacherOptions = teachers.map((item) => ({ value: item.name, label: `${item.name} (${item.id})` }));
  const options = viewMode === 'class'
    ? classOptions
    : teacherOptions;

  const openCreateModal = (defaults = {}) => {
    setEditingLesson(null);
    form.resetFields();
    form.setFieldsValue({
      className: viewMode === 'class' ? selectedId : undefined,
      teacherName: viewMode === 'teacher' ? selectedId : undefined,
      weekday: 'monday',
      period: periods[0]?.number,
      ...defaults,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    form.setFieldsValue(lesson);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLesson(null);
    form.resetFields();
  };

  const handleSaveLesson = (values) => {
    const result = saveLesson(values, editingLesson?.id);
    if (!result.saved) {
      message.error(result.reason === 'conflict'
        ? 'Lớp hoặc giáo viên đã có lịch ở khung giờ này.'
        : 'Không thể lưu thời khóa biểu vào trình duyệt.');
      return;
    }

    setLessons(getLessons());
    closeModal();
    message.success(editingLesson ? 'Đã cập nhật tiết học.' : 'Đã thêm tiết học.');
  };

  const openSettings = () => {
    setDraftSettings({ ...settings, periods: settings.periods.map((period) => ({ ...period })) });
    setIsSettingsOpen(true);
  };

  const updatePeriodCount = (value) => {
    const periodCount = Math.min(20, Math.max(1, Number(value) || 1));
    setDraftSettings((current) => ({
      ...current,
      periodCount,
      morningPeriods: Math.min(current.morningPeriods, periodCount),
      periods: Array.from({ length: periodCount }, (_, index) => (
        current.periods[index] ?? { duration: null, breakAfter: 5 }
      )),
    }));
  };

  const updatePeriodTiming = (index, field, value) => {
    setDraftSettings((current) => ({
      ...current,
      periods: current.periods.map((period, periodIndex) => (
        periodIndex === index
          ? { ...period, [field]: value ?? (field === 'duration' ? null : 0) }
          : period
      )),
    }));
  };

  const addPeriod = () => {
    if (draftSettings.periodCount >= 20) {
      message.warning('Tối đa 20 tiết mỗi ngày.');
      return;
    }

    updatePeriodCount(draftSettings.periodCount + 1);
  };

  const handleSaveSettings = () => {
    if (draftSettings.morningPeriods > draftSettings.periodCount) {
      message.error('Số tiết buổi sáng không được vượt tổng số tiết trong ngày.');
      return;
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draftSettings.morningStart)
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draftSettings.afternoonStart)) {
      message.error('Vui lòng nhập giờ bắt đầu hợp lệ cho cả hai buổi.');
      return;
    }

    const getSessionDuration = (sessionPeriods) => {
      const configuredPeriods = sessionPeriods.filter((period) => period.duration > 0);
      return configuredPeriods.reduce((total, period, index) => (
        total + period.duration + (index < configuredPeriods.length - 1 ? period.breakAfter : 0)
      ), 0);
    };
    const morningMinutes = getSessionDuration(draftSettings.periods.slice(0, draftSettings.morningPeriods));
    const afternoonMinutes = getSessionDuration(draftSettings.periods.slice(draftSettings.morningPeriods));

    if (timeToMinutes(draftSettings.morningStart) + morningMinutes > 24 * 60
      || timeToMinutes(draftSettings.afternoonStart) + afternoonMinutes > 24 * 60) {
      message.error('Thời khóa biểu của mỗi buổi phải kết thúc trước 24:00.');
      return;
    }

    if (draftSettings.morningPeriods > 0
      && draftSettings.morningPeriods < draftSettings.periodCount
      && timeToMinutes(draftSettings.morningStart) + morningMinutes > timeToMinutes(draftSettings.afternoonStart)) {
      message.error('Buổi chiều phải bắt đầu sau khi buổi sáng kết thúc.');
      return;
    }

    if (!saveTimetableSettings(draftSettings)) {
      message.error('Không thể lưu cài đặt thời khóa biểu.');
      return;
    }

    setSettings(draftSettings);
    setIsSettingsOpen(false);
    message.success('Đã cập nhật cấu hình thời khóa biểu.');
  };

  const columns = [
    {
      title: 'Tiết',
      dataIndex: 'period',
      key: 'period',
      fixed: 'left',
      width: 140,
      render: (period) => (
        <Space direction="vertical" size={0}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{period.session}</Typography.Text>
          <Typography.Text strong>Tiết {period.number}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{period.time}</Typography.Text>
        </Space>
      ),
    },
    ...weekdays.map((day) => ({
      title: day.label,
      dataIndex: day.key,
      key: day.key,
      width: 170,
      render: (lesson, row) => lesson ? (
        <Space direction="vertical" size={3} style={{ width: '100%' }}>
          <Tag color="blue" style={{ marginInlineEnd: 0 }}>{lesson.subject}</Tag>
          <Typography.Text style={{ fontSize: 12 }}>
            {viewMode === 'class' ? lesson.teacherName : lesson.className}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Phòng {lesson.room}</Typography.Text>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(lesson)}>
            Chỉnh sửa
          </Button>
        </Space>
      ) : (
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          aria-label={`Thêm tiết ${row.period.number}, ${day.label}`}
          onClick={() => openCreateModal({ weekday: day.key, period: row.period.number })}
        />
      ),
    })),
  ];

  const tableData = useMemo(() => periods.map((period) => {
    const row = { key: period.number, period };
    weekdays.forEach((day) => {
      row[day.key] = lessons.find((lesson) => (
        lesson.period === period.number
        && lesson.weekday === day.key
        && (viewMode === 'class' ? lesson.className === selectedId : lesson.teacherName === selectedId)
      ));
    });
    return row;
  }), [lessons, periods, selectedId, viewMode]);

  const handleModeChange = (mode) => {
    setViewMode(mode);
    setSelectedId(undefined);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>Thời khóa biểu</Typography.Title>
          <Typography.Text type="secondary">Tra cứu lịch học theo lớp hoặc lịch giảng dạy theo giáo viên.</Typography.Text>
        </div>
        <Button icon={<SettingOutlined />} onClick={openSettings}>
          Cài đặt lịch
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space size="large" wrap align="end">
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Xem theo</Typography.Text>
            <Segmented
              value={viewMode}
              onChange={handleModeChange}
              options={[
                { label: 'Lớp học', value: 'class' },
                { label: 'Giáo viên', value: 'teacher' },
              ]}
            />
          </div>
          <div style={{ width: 300, maxWidth: '100%' }}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              {viewMode === 'class' ? 'Chọn lớp' : 'Chọn giáo viên'}
            </Typography.Text>
            <Select
              value={selectedId}
              onChange={setSelectedId}
              options={options}
              showSearch
              optionFilterProp="label"
              placeholder={viewMode === 'class' ? 'Chọn lớp cần xem' : 'Chọn giáo viên cần xem'}
              style={{ width: '100%' }}
            />
          </div>
        </Space>
      </Card>

      {!selectedId ? (
        <Card><Empty description={`Chọn ${viewMode === 'class' ? 'một lớp' : 'một giáo viên'} để hiển thị thời khóa biểu.`} /></Card>
      ) : (
        <Card
          title={viewMode === 'class' ? `Thời khóa biểu lớp ${selectedId}` : `Lịch giảng dạy: ${selectedId}`}
          extra={(
            <Space>
              <Typography.Text type="secondary">Thứ 2 - Thứ 7</Typography.Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateModal()} disabled={!periods.length}>
                Thêm tiết học
              </Button>
            </Space>
          )}
          styles={{ body: { padding: 0 } }}
        >
          {periods.length ? (
            <Table
              rowKey="key"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: 1160 }}
            />
          ) : (
            <Empty description="Chưa có tiết nào được cài giờ. Hãy mở Cài đặt lịch để thêm và cấu hình tiết." />
          )}
        </Card>
      )}

      <Modal
        title={editingLesson ? 'Chỉnh sửa tiết học' : 'Thêm tiết học'}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSaveLesson}>
          <Form.Item name="className" label="Lớp học" rules={[{ required: true, message: 'Chọn lớp học.' }]}>
            <Select options={classOptions} showSearch optionFilterProp="label" placeholder="Chọn lớp" />
          </Form.Item>
          <Form.Item name="teacherName" label="Giáo viên" rules={[{ required: true, message: 'Chọn giáo viên.' }]}>
            <Select options={teacherOptions} showSearch optionFilterProp="label" placeholder="Chọn giáo viên" />
          </Form.Item>
          <Form.Item name="subject" label="Môn học" rules={[{ required: true, whitespace: true, message: 'Nhập môn học.' }]}>
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item name="room" label="Phòng học" rules={[{ required: true, whitespace: true, message: 'Nhập phòng học.' }]}>
            <Input maxLength={40} />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="weekday" label="Thứ" rules={[{ required: true, message: 'Chọn thứ.' }]}>
              <Select options={weekdays.map(({ key, label }) => ({ value: key, label }))} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="period" label="Tiết" rules={[{ required: true, message: 'Chọn tiết.' }]}>
              <Select
                options={periods.map(({ number, session, time }) => ({
                  value: number,
                  label: `${session} - Tiết ${number} (${time})`,
                }))}
                style={{ width: 220 }}
              />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="Cài đặt thời khóa biểu"
        open={isSettingsOpen}
        onCancel={() => setIsSettingsOpen(false)}
        onOk={handleSaveSettings}
        okText="Lưu cấu hình"
        cancelText="Hủy"
        width={760}
        destroyOnHidden
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="start" size="large">
            <Form.Item label="Số tiết mỗi ngày" style={{ marginBottom: 0 }}>
              <InputNumber
                min={1}
                max={20}
                value={draftSettings.periodCount}
                onChange={updatePeriodCount}
              />
            </Form.Item>
            <Form.Item label="Số tiết buổi sáng" style={{ marginBottom: 0 }}>
              <InputNumber
                min={0}
                max={draftSettings.periodCount}
                value={draftSettings.morningPeriods}
                onChange={(value) => setDraftSettings((current) => ({
                  ...current,
                  morningPeriods: Math.min(current.periodCount, Math.max(0, Number(value) || 0)),
                }))}
              />
            </Form.Item>
            <Form.Item label="Bắt đầu buổi sáng" style={{ marginBottom: 0 }}>
              <Input
                type="time"
                value={draftSettings.morningStart}
                onChange={(event) => setDraftSettings((current) => ({ ...current, morningStart: event.target.value }))}
              />
            </Form.Item>
            <Form.Item label="Bắt đầu buổi chiều" style={{ marginBottom: 0 }}>
              <Input
                type="time"
                value={draftSettings.afternoonStart}
                onChange={(event) => setDraftSettings((current) => ({ ...current, afternoonStart: event.target.value }))}
              />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography.Text strong>Thời lượng và giờ nghỉ từng tiết</Typography.Text>
            <Button icon={<PlusOutlined />} onClick={addPeriod} disabled={draftSettings.periodCount >= 20}>
              Thêm tiết
            </Button>
          </Space>
          <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}>
            {draftSettings.periods.map((period, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(100px, 1fr) repeat(2, minmax(130px, 180px))',
                  alignItems: 'center',
                  gap: 16,
                  padding: '10px 16px',
                  borderBottom: index < draftSettings.periods.length - 1 ? '1px solid #f0f0f0' : undefined,
                }}
              >
                <Space direction="vertical" size={2}>
                  <Typography.Text>{index < draftSettings.morningPeriods ? 'Sáng' : 'Chiều'} · Tiết {index + 1}</Typography.Text>
                  {period.duration == null && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      Chưa cài giờ, sẽ không hiển thị
                    </Typography.Text>
                  )}
                </Space>
                <Space size={6}>
                  <InputNumber
                    min={1}
                    max={180}
                    value={period.duration ?? null}
                    onChange={(value) => updatePeriodTiming(index, 'duration', value)}
                    aria-label={`Thời lượng tiết ${index + 1}`}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ClearOutlined />}
                    aria-label={`Xóa thời lượng tiết ${index + 1}`}
                    onClick={() => updatePeriodTiming(index, 'duration', null)}
                  />
                  <Typography.Text type="secondary">phút</Typography.Text>
                </Space>
                <Space size={6}>
                  <InputNumber
                    min={0}
                    max={60}
                    value={period.breakAfter}
                    onChange={(value) => updatePeriodTiming(index, 'breakAfter', value)}
                    aria-label={`Thời gian nghỉ sau tiết ${index + 1}`}
                  />
                  <Typography.Text type="secondary">nghỉ (phút)</Typography.Text>
                </Space>
              </div>
            ))}
          </div>
          <Typography.Text type="secondary">
            Giờ kết thúc từng tiết được tính từ giờ bắt đầu buổi, thời lượng và giờ nghỉ đã cài đặt.
          </Typography.Text>
        </Space>
      </Modal>
    </div>
  );
};

export default Timetable;
