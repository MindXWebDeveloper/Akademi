import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, ReadOutlined, SaveOutlined } from '@ant-design/icons';
import {
  createStudent,
  generateStudentId,
  getStudentById,
  saveStudent,
} from '../../../data/students';
import StudentGradeSummary from '../StudentGradeSummary';

const genderOptions = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
  { value: 'Khác', label: 'Khác' },
];

const StudentDetail = ({ isCreateMode = false }) => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const student = isCreateMode ? null : getStudentById(studentId);

  useEffect(() => {
    if (isCreateMode) {
      form.resetFields();
      form.setFieldsValue({ id: generateStudentId() });
    } else {
      const currentStudent = getStudentById(studentId);
      if (currentStudent) {
        form.setFieldsValue(currentStudent);
      }
    }
  }, [form, isCreateMode, studentId]);

  const handleSave = (values) => {
    const saved = isCreateMode
      ? createStudent(values)
      : saveStudent(studentId, { ...student, ...values });

    if (!saved) {
      message.error(isCreateMode
        ? 'Không thể thêm học sinh. Mã học sinh có thể đã tồn tại.'
        : 'Không thể lưu thông tin học sinh.');
      return;
    }

    message.success(isCreateMode ? 'Đã thêm học sinh.' : 'Đã lưu thông tin học sinh.');
    navigate('/students');
  };

  if (!student && !isCreateMode) {
    return (
      <Card>
        <Alert
          type="warning"
          showIcon
          message="Không tìm thấy học sinh"
          description={`Mã học sinh ${studentId} không tồn tại trong danh sách.`}
          action={<Button onClick={() => navigate('/students')}>Về danh sách</Button>}
        />
      </Card>
    );
  }

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/students')}
        style={{ paddingInline: 0, marginBottom: 16 }}
      >
        Danh sách học sinh
      </Button>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Typography.Title level={3} style={{ margin: '0 0 4px' }}>
              {isCreateMode ? 'Thêm học sinh' : 'Hồ sơ học sinh'}
            </Typography.Title>
            <Typography.Text type="secondary">
              {isCreateMode
                ? 'Nhập thông tin cá nhân, liên hệ và lớp học cho học sinh mới.'
                : 'Xem và cập nhật thông tin cá nhân, liên hệ và lớp học.'}
            </Typography.Text>
          </div>
          {!isCreateMode && (
            <Button
              icon={<ReadOutlined />}
              onClick={() => navigate(`/students/${studentId}/transcript`)}
            >
              Xem học bạ
            </Button>
          )}
        </div>
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
                      if (!value || value.trim() === studentId || !getStudentById(value.trim())) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mã học sinh này đã được sử dụng.'));
                    },
                  },
                ]}
              >
                <Input maxLength={30} readOnly={isCreateMode} />
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
                  { pattern: /^[0-9+\s().-]{8,20}$/, message: 'Số điện thoại chưa hợp lệ.' },
                ]}
              >
                <Input inputMode="tel" maxLength={20} />
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
            <Col xs={24} md={12}>
              <Form.Item
                label="Lớp hiện tại"
                name="className"
                rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lớp hiện tại.' }]}
              >
                <Input maxLength={30} />
              </Form.Item>
            </Col>
          </Row>

          <Space style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              {isCreateMode ? 'Thêm học sinh' : 'Lưu thay đổi'}
            </Button>
            <Button onClick={() => navigate('/students')}>
              Hủy
            </Button>
          </Space>
        </Form>
      </Card>
      {!isCreateMode && <StudentGradeSummary studentId={studentId} />}
    </div>
  );
};

export default StudentDetail;
