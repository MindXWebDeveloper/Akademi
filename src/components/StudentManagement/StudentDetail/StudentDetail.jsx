import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, ReadOutlined, SaveOutlined } from '@ant-design/icons';
import {
  createStudent,
  generateStudentId,
  getStudentById,
  getStudentEnrollments,
  saveStudent,
} from '../../../data/students';
import { getRecords } from '../../../data/schoolRecords';
import { getCurrentSchoolYear, getSchoolYears } from '../../../data/schoolYears';
import StudentGradeSummary from '../StudentGradeSummary';
import { phoneNumberPattern, phoneNumberValidationMessage } from '../../../utils/validation';

const genderOptions = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
  { value: 'Khác', label: 'Khác' },
];

const StudentDetail = ({ isCreateMode = false, selfService = false, profileId }) => {
  const { studentId } = useParams();
  const activeStudentId = selfService ? profileId : studentId;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const requestedReturnTo = location.state?.returnTo;
  const returnTo = typeof requestedReturnTo === 'string'
    && (requestedReturnTo === '/students' || requestedReturnTo.startsWith('/students?'))
    ? requestedReturnTo
    : '/students';
  const goToList = () => navigate(returnTo, { replace: true });
  const [form] = Form.useForm();
  const requestedSchoolYear = searchParams.get('schoolYear');
  const schoolYears = getSchoolYears();
  const [studentSchoolYear, setStudentSchoolYear] = useState(() => schoolYears.includes(requestedSchoolYear)
    ? requestedSchoolYear
    : getCurrentSchoolYear());
  const student = isCreateMode ? null : getStudentById(activeStudentId, studentSchoolYear);
  const currentYearClasses = getRecords('classes').filter((item) => item.schoolYear === studentSchoolYear);
  const enrollmentHistory = getStudentEnrollments(activeStudentId)
    .sort((left, right) => right.schoolYear.localeCompare(left.schoolYear));
  const returnToDashboard = () => navigate('/dashboard', { replace: true });

  useEffect(() => {
    if (isCreateMode) {
      form.resetFields();
      form.setFieldsValue({ id: generateStudentId() });
    } else {
      const currentStudent = getStudentById(activeStudentId, studentSchoolYear);
      if (currentStudent) {
        form.setFieldsValue(currentStudent);
      }
    }
  }, [activeStudentId, form, isCreateMode, studentSchoolYear]);

  const handleSave = async (values) => {
    const result = isCreateMode
      ? await createStudent(values, studentSchoolYear)
      : await saveStudent(activeStudentId, selfService ? values : { ...student, ...values });

    if (!result.saved) {
      message.error(isCreateMode
        ? `Không thể thêm đầy đủ học sinh. ${result.reason === 'duplicate' ? 'Mã học sinh có thể đã tồn tại.' : result.reason === 'duplicate-profile' ? 'Học sinh có cùng họ tên, năm sinh, giới tính và địa chỉ đã tồn tại.' : result.reason === 'partial-failure' ? `Đã lưu một phần; còn thiếu: ${result.remaining?.join(', ') ?? 'dữ liệu liên quan'}.` : ''} ${result.username ? `Tài khoản ${result.username}, mật khẩu: ${result.studentCode}.` : ''} ${result.error?.message ?? ''}`
        : `Không thể lưu thông tin học sinh.${result.reason === 'duplicate-profile' ? ' Học sinh có cùng họ tên, năm sinh, giới tính và địa chỉ đã tồn tại.' : ''}${result.error ? ` ${result.error.message}` : ''}`);
      return;
    }

    message.success(isCreateMode ? 'Đã thêm học sinh.' : 'Đã lưu thông tin học sinh.');
    if (isCreateMode) {
      message.info(`Tài khoản học sinh: ${result.username} · Mật khẩu: ${result.studentCode}`, 8);
    }
    if (selfService) {
      navigate('/profile', { replace: true });
      return;
    }
    goToList();
  };

  if (!student && !isCreateMode) {
    return (
      <Card>
        <Alert
          type="warning"
          showIcon
          message="Không tìm thấy học sinh"
          description={`Mã học sinh ${activeStudentId} không tồn tại trong danh sách.`}
          action={<Button onClick={selfService ? returnToDashboard : goToList}>Về {selfService ? 'tổng quan' : 'danh sách'}</Button>}
        />
      </Card>
    );
  }

  return (
    <div>
      {!selfService && (
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={goToList}
          style={{ paddingInline: 0, marginBottom: 16 }}
        >
          Danh sách học sinh
        </Button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>
            {selfService ? 'Thông tin cá nhân' : isCreateMode ? 'Thêm học sinh' : 'Hồ sơ học sinh'}
          </Typography.Title>
          <Typography.Text type="secondary">
            {isCreateMode
              ? 'Nhập thông tin cá nhân, liên hệ và lớp học cho học sinh mới.'
              : `Năm học ${studentSchoolYear} · Lớp ${student?.className || 'chưa được xếp lớp'}`}
          </Typography.Text>
        </div>
        {!isCreateMode && !selfService && (
          <Button
            icon={<ReadOutlined />}
            onClick={() => navigate(`/students/${studentId}/transcript`, { state: location.state })}
          >
            Xem học bạ
          </Button>
        )}
        {!isCreateMode && selfService && (
          <Button
            icon={<ReadOutlined />}
            onClick={() => navigate('/my-transcript')}
          >
            Xem học bạ
          </Button>
        )}
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={[20, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Mã số học sinh"
                name="id"
                rules={[
                  { required: true, whitespace: true, message: 'Vui lòng nhập mã học sinh.' },
                  {
                    validator: (_, value) => {
                      if (!value || value.trim() === activeStudentId || !getStudentById(value.trim())) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mã học sinh này đã được sử dụng.'));
                    },
                  },
                ]}
              >
                <Input maxLength={30} readOnly />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên.' }]}
              >
                <Input maxLength={100} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Năm sinh"
                name="birthYear"
                rules={[
                  { required: true, message: 'Vui lòng nhập năm sinh.' },
                  { pattern: /^\d{4}$/, message: 'Năm sinh gồm 4 chữ số.' },
                ]}
              >
                <Input inputMode="numeric" maxLength={4} placeholder="Ví dụ: 2010" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: 'Vui lòng chọn giới tính.' }]}>
                <Select options={genderOptions} placeholder="Chọn giới tính" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Quê quán"
                name="hometown"
                rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập quê quán.' }]}
              >
                <Input maxLength={150} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Dân tộc"
                name="ethnicity"
                rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập dân tộc.' }]}
              >
                <Input maxLength={80} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Nơi cư trú"
                name="address"
                rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập nơi cư trú.' }]}
              >
                <Input maxLength={250} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại.' },
                  { pattern: phoneNumberPattern, message: phoneNumberValidationMessage },
                ]}
              >
                <Input inputMode="numeric" maxLength={10} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email.' },
                  { type: 'email', message: 'Địa chỉ email chưa hợp lệ.' },
                ]}
              >
                <Input type="email" maxLength={150} />
              </Form.Item>
            </Col>
            {isCreateMode && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={`Lớp năm học ${studentSchoolYear}`}
                  name="className"
                  rules={[{ required: true, message: 'Vui lòng chọn lớp.' }]}
                >
                  <Select
                    options={currentYearClasses.map((item) => ({ value: item.name, label: item.name }))}
                    placeholder="Chọn lớp"
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Space style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              {isCreateMode ? 'Thêm học sinh' : 'Lưu thay đổi'}
            </Button>
            {!selfService && <Button onClick={goToList}>Hủy</Button>}
          </Space>
        </Form>
      </Card>
      {!isCreateMode && (
        <Card
          title="Lịch sử phân lớp theo năm học"
          extra={(
            <Select
              aria-label="Năm học hồ sơ học sinh"
              value={studentSchoolYear}
              onChange={setStudentSchoolYear}
              options={schoolYears.map((year) => ({
                value: year,
                label: `${year}${year === getCurrentSchoolYear() ? ' · Hiện tại' : ''}`,
              }))}
              style={{ width: 190 }}
            />
          )}
          style={{ marginTop: 24 }}
          styles={{ body: { padding: 0 } }}
        >
          {enrollmentHistory.length ? (
            <Table
              rowKey="schoolYear"
              pagination={false}
              dataSource={enrollmentHistory}
              columns={[
                { title: 'Năm học', dataIndex: 'schoolYear', key: 'schoolYear' },
                { title: 'Lớp', dataIndex: 'className', key: 'className' },
                { title: 'Mã lớp', dataIndex: 'classId', key: 'classId', render: (value) => value || '—' },
              ]}
            />
          ) : <Typography.Text type="secondary" style={{ display: 'block', padding: 24 }}>Chưa có thông tin phân lớp theo năm học.</Typography.Text>}
        </Card>
      )}
      {!isCreateMode && !selfService && <StudentGradeSummary studentId={activeStudentId} />}
    </div>
  );
};

export default StudentDetail;
