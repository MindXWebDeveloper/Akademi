import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ClearOutlined, PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { getStudents } from '../../data/students';

const columns = [
  { title: 'Mã học sinh', dataIndex: 'id', key: 'id', width: 130 },
  { title: 'Họ và tên', dataIndex: 'name', key: 'name' },
  { title: 'Giới tính', dataIndex: 'gender', key: 'gender', width: 100 },
  { title: 'Năm sinh', dataIndex: 'birthYear', key: 'birthYear', width: 100 },
  { title: 'Lớp hiện tại', dataIndex: 'className', key: 'className', width: 120 },
  { title: 'Phụ huynh', dataIndex: 'guardian', key: 'guardian' },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: 130,
    render: (status) => <Tag color={status === 'Đang học' ? 'green' : 'orange'}>{status}</Tag>,
  },
];

const StudentManagement = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [matchedStudents, setMatchedStudents] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');
  const classOptions = [...new Set(getStudents().map((student) => student.className))]
    .sort()
    .map((className) => ({ value: className, label: className }));

  const handleSearch = (values) => {
    const studentId = values.studentId?.trim().toLocaleLowerCase('vi');
    const studentName = values.studentName?.trim().toLocaleLowerCase('vi');
    const className = values.className;

    if (!studentId && !studentName && !className) {
      setMatchedStudents(null);
      setValidationMessage('Nhập mã học sinh, tên học sinh hoặc chọn lớp học để xem danh sách.');
      return;
    }

    setValidationMessage('');
    setMatchedStudents(getStudents().filter((student) => (
      (!studentId || student.id.toLocaleLowerCase('vi').includes(studentId))
      && (!studentName || student.name.toLocaleLowerCase('vi').includes(studentName))
      && (!className || student.className === className)
    )));
  };

  const handleReset = () => {
    form.resetFields();
    setMatchedStudents(null);
    setValidationMessage('');
  };

  const groupedStudents = matchedStudents?.reduce((groups, student) => {
    groups[student.className] ??= [];
    groups[student.className].push(student);
    return groups;
  }, {}) ?? {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>
            Quản lý học sinh
          </Typography.Title>
          <Typography.Text type="secondary">
            Tra cứu danh sách học sinh theo mã, họ tên hoặc lớp.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/students/new')}>
          Thêm học sinh
        </Button>
      </div>

      <Card title="Điều kiện tìm kiếm" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          onValuesChange={() => setValidationMessage('')}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
            <Form.Item label="Mã học sinh" name="studentId" style={{ marginBottom: 0 }}>
              <Input prefix={<UserOutlined />} placeholder="Ví dụ: HS001" allowClear />
            </Form.Item>
            <Form.Item label="Tên học sinh" name="studentName" style={{ marginBottom: 0 }}>
              <Input placeholder="Nhập họ hoặc tên học sinh" allowClear />
            </Form.Item>
            <Form.Item label="Lớp học" name="className" style={{ marginBottom: 0 }}>
              <Select options={classOptions} placeholder="Chọn lớp" allowClear />
            </Form.Item>
          </div>

          {validationMessage && (
            <Alert
              showIcon
              type="warning"
              message={validationMessage}
              style={{ marginTop: 16 }}
            />
          )}

          <Space style={{ marginTop: 20 }}>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Tìm kiếm
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleReset}>
              Xóa điều kiện
            </Button>
          </Space>
        </Form>
      </Card>

      {matchedStudents === null ? (
        <Card>
          <Empty description="Nhập ít nhất một điều kiện để hiển thị danh sách học sinh." />
        </Card>
      ) : matchedStudents.length === 0 ? (
        <Card>
          <Empty description="Không tìm thấy học sinh phù hợp." />
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            Tìm thấy {matchedStudents.length} học sinh trong {Object.keys(groupedStudents).length} lớp.
          </Typography.Text>
          {Object.entries(groupedStudents).map(([className, classStudents]) => (
            <Card
              key={className}
              title={`Lớp ${className}`}
              extra={<Typography.Text type="secondary">{classStudents.length} học sinh</Typography.Text>}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                rowKey="id"
                columns={[
                  ...columns,
                  {
                    title: 'Thao tác',
                    key: 'action',
                    width: 190,
                    render: (_, student) => (
                      <Space size="small">
                        <Link className="ant-btn ant-btn-link" to={`/students/${student.id}`}>
                          Chi tiết
                        </Link>
                        <Link className="ant-btn ant-btn-link" to={`/students/${student.id}/grades`}>
                          Nhập điểm
                        </Link>
                      </Space>
                    ),
                  },
                ]}
                dataSource={classStudents}
                pagination={false}
                scroll={{ x: 760 }}
              />
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
};

export default StudentManagement;
