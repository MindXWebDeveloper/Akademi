import { useEffect, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { getStudents } from '../../data/students';
import { getRecords } from '../../data/schoolRecords';
import {
  addActivityParticipants,
  createActivity,
  getActivityById,
  removeActivityParticipant,
  updateActivity,
} from '../../data/extracurricularActivities';

const ActivityDetail = ({ isCreateMode = false }) => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [, refreshActivity] = useReducer((revision) => revision + 1, 0);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [staffName, setStaffName] = useState('');
  const classes = getRecords('classes');
  const students = getStudents();
  const teachers = getRecords('teachers');
  const activity = isCreateMode ? null : getActivityById(activityId);

  useEffect(() => {
    if (!isCreateMode) {
      const currentActivity = getActivityById(activityId);
      if (currentActivity) form.setFieldsValue(currentActivity);
    }
  }, [activityId, form, isCreateMode]);

  const saveActivity = async (values) => {
    if (new Date(values.endAt) <= new Date(values.startAt)) {
      form.setFields([{ name: 'endAt', errors: ['Thời gian kết thúc phải sau thời gian bắt đầu.'] }]);
      return;
    }

    const details = {
      ...values,
      capacity: values.capacity ?? null,
      registrationOpen: Boolean(values.registrationOpen),
    };

    if (isCreateMode) {
      const createdActivity = createActivity(details);
      if (!createdActivity) {
        message.error('Không thể lưu hoạt động vào trình duyệt.');
        return;
      }
      message.success('Đã tạo hoạt động.');
      navigate(`/activities/${createdActivity.id}`, { replace: true });
      return;
    }

    if (!updateActivity(activityId, details)) {
      message.error('Không thể cập nhật hoạt động.');
      return;
    }
    refreshActivity();
    message.success('Đã cập nhật hoạt động.');
  };

  const appendParticipants = (role, entries) => {
    const result = addActivityParticipants(activityId, role, entries);
    if (result.reason === 'registration-closed') {
      message.warning('Hoạt động hiện không mở đăng ký học sinh.');
    } else if (result.reason === 'capacity') {
      message.warning('Số học sinh vượt quá sức chứa của hoạt động.');
    } else if (result.reason === 'storage') {
      message.error('Không thể lưu danh sách tham gia.');
    } else if (result.reason === 'duplicate') {
      message.info('Những người đã có trong danh sách được bỏ qua.');
    } else if (result.added) {
      message.success(`Đã thêm ${result.added} mục tham gia.`);
    }
    refreshActivity();
  };

  const removeParticipant = (role, participantId) => {
    if (!removeActivityParticipant(activityId, role, participantId)) {
      message.error('Không thể cập nhật danh sách tham gia.');
      return;
    }
    refreshActivity();
  };

  const addClasses = () => {
    const entries = classes
      .filter((item) => selectedClassIds.includes(item.id))
      .map((item) => ({ id: item.id, name: item.name, grade: item.grade }));
    appendParticipants('classes', entries);
    setSelectedClassIds([]);
  };

  const addStudents = () => {
    const entries = students
      .filter((item) => selectedStudentIds.includes(item.id))
      .map((item) => ({ id: item.id, name: item.name, className: item.className }));
    appendParticipants('students', entries);
    setSelectedStudentIds([]);
  };

  const addTeachers = () => {
    const entries = teachers
      .filter((item) => selectedTeacherIds.includes(item.id))
      .map((item) => ({ id: item.id, name: item.name, subject: item.subject }));
    appendParticipants('teachers', entries);
    setSelectedTeacherIds([]);
  };

  const addStaff = () => {
    const name = staffName.trim();
    if (!name) return;
    appendParticipants('staff', [{ id: name.toLocaleLowerCase('vi'), name }]);
    setStaffName('');
  };

  const participantColumns = (role) => [
    { title: 'Mã', dataIndex: 'id', key: 'id', width: 130 },
    { title: 'Họ và tên', dataIndex: 'name', key: 'name' },
    ...(role === 'students' ? [{ title: 'Lớp', dataIndex: 'className', key: 'className' }] : []),
    ...(role === 'teachers' ? [{ title: 'Môn giảng dạy', dataIndex: 'subject', key: 'subject' }] : []),
    ...(role === 'classes' ? [{ title: 'Khối', dataIndex: 'grade', key: 'grade' }] : []),
    {
      title: '',
      key: 'remove',
      width: 100,
      render: (_, participant) => (
        <Popconfirm title="Xóa khỏi danh sách tham gia?" onConfirm={() => removeParticipant(role, participant.id)}>
          <Button type="link" danger>Xóa</Button>
        </Popconfirm>
      ),
    },
  ];

  if (!isCreateMode && !activity) {
    return (
      <Card>
        <Alert
          type="warning"
          showIcon
          message="Không tìm thấy hoạt động"
          description={`Mã hoạt động ${activityId} không tồn tại.`}
          action={<Button onClick={() => navigate('/activities')}>Về danh sách hoạt động</Button>}
        />
      </Card>
    );
  }

  const participants = activity?.participants ?? { classes: [], students: [], teachers: [], staff: [] };
  const participantTabs = [
    { key: 'classes', label: `Lớp (${participants.classes?.length ?? 0})` },
    { key: 'students', label: `Học sinh (${participants.students?.length ?? 0})` },
    { key: 'teachers', label: `Giáo viên (${participants.teachers?.length ?? 0})` },
    { key: 'staff', label: `Nhân viên (${participants.staff?.length ?? 0})` },
  ].map((tab) => ({
    ...tab,
    children: participants[tab.key]?.length ? (
      <Table
        rowKey="id"
        columns={participantColumns(tab.key)}
        dataSource={participants[tab.key]}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        scroll={{ x: 'max-content' }}
      />
    ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có người tham gia." />,
  }));

  return (
    <div>
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/activities')} style={{ paddingInline: 0, marginBottom: 16 }}>
        Danh sách hoạt động
      </Button>
      <Typography.Title level={3} style={{ margin: '0 0 20px' }}>
        {isCreateMode ? 'Tạo hoạt động ngoài khóa' : activity.title}
      </Typography.Title>

      <Card title="Thông tin hoạt động" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={isCreateMode ? { registrationOpen: true } : undefined}
          onFinish={saveActivity}
        >
          <Row gutter={[20, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label="Tên hoạt động" name="title" rules={[{ required: true, whitespace: true, message: 'Nhập tên hoạt động.' }]}>
                <Input maxLength={120} placeholder="Ví dụ: Ngày hội khoa học" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Địa điểm" name="location" rules={[{ required: true, whitespace: true, message: 'Nhập địa điểm tổ chức.' }]}>
                <Input maxLength={160} placeholder="Ví dụ: Sân trường" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Bắt đầu" name="startAt" rules={[{ required: true, message: 'Chọn thời gian bắt đầu.' }]}>
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Kết thúc" name="endAt" rules={[{ required: true, message: 'Chọn thời gian kết thúc.' }]}>
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Sức chứa học sinh" name="capacity" extra="Để trống nếu không giới hạn số lượng.">
                <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Cho phép học sinh đăng ký" name="registrationOpen" valuePropName="checked">
                <Switch checkedChildren="Mở" unCheckedChildren="Đóng" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Mô tả" name="description">
                <Input.TextArea rows={3} maxLength={1200} showCount placeholder="Nội dung và lưu ý cho người tham gia" />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            {isCreateMode ? 'Tạo hoạt động' : 'Lưu thông tin'}
          </Button>
        </Form>
      </Card>

      {!isCreateMode && (
        <Card title="Thành phần tham gia" extra={<Typography.Text type="secondary">Quản lý theo lớp, học sinh, giáo viên và nhân viên</Typography.Text>}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>Thêm lớp</Typography.Text>
              <Space.Compact style={{ display: 'flex', marginTop: 8, maxWidth: 680 }}>
                <Select
                  mode="multiple"
                  aria-label="Chọn lớp tham gia"
                  value={selectedClassIds}
                  onChange={setSelectedClassIds}
                  options={classes.map((item) => ({ value: item.id, label: item.name }))}
                  placeholder="Chọn một hoặc nhiều lớp"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <Button icon={<PlusOutlined />} onClick={addClasses}>Thêm lớp</Button>
              </Space.Compact>
            </div>
            <div>
              <Typography.Text strong>Đăng ký học sinh</Typography.Text>
              <Space.Compact style={{ display: 'flex', marginTop: 8, maxWidth: 680 }}>
                <Select
                  mode="multiple"
                  aria-label="Chọn học sinh tham gia"
                  value={selectedStudentIds}
                  onChange={setSelectedStudentIds}
                  options={students.map((item) => ({ value: item.id, label: `${item.name} · ${item.className}` }))}
                  placeholder="Tìm và chọn học sinh"
                  showSearch
                  optionFilterProp="label"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <Button type="primary" icon={<PlusOutlined />} disabled={!activity.registrationOpen} onClick={addStudents}>Đăng ký</Button>
              </Space.Compact>
              {!activity.registrationOpen && <Typography.Text type="secondary">Đăng ký học sinh hiện đã đóng.</Typography.Text>}
            </div>
            <div>
              <Typography.Text strong>Thêm giáo viên</Typography.Text>
              <Space.Compact style={{ display: 'flex', marginTop: 8, maxWidth: 680 }}>
                <Select
                  mode="multiple"
                  aria-label="Chọn giáo viên tham gia"
                  value={selectedTeacherIds}
                  onChange={setSelectedTeacherIds}
                  options={teachers.map((item) => ({ value: item.id, label: item.name }))}
                  placeholder="Chọn một hoặc nhiều giáo viên"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <Button icon={<PlusOutlined />} onClick={addTeachers}>Thêm giáo viên</Button>
              </Space.Compact>
            </div>
            <div>
              <Typography.Text strong>Thêm nhân viên</Typography.Text>
              <Space.Compact style={{ display: 'flex', marginTop: 8, maxWidth: 680 }}>
                <Input
                  aria-label="Tên nhân viên tham gia"
                  value={staffName}
                  onChange={(event) => setStaffName(event.target.value)}
                  onPressEnter={addStaff}
                  placeholder="Nhập họ tên nhân viên"
                  maxLength={100}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <Button icon={<PlusOutlined />} onClick={addStaff}>Thêm nhân viên</Button>
              </Space.Compact>
            </div>
          </Space>
          <Tabs items={participantTabs} style={{ marginTop: 24 }} />
        </Card>
      )}
    </div>
  );
};

export default ActivityDetail;