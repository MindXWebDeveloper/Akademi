import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Card,
  Typography,
  Tabs,
  message,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { authenticateUser } from '../../data/authentication';

const { Title, Text, Link } = Typography;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('principal');
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const user = authenticateUser({ ...values, role });
      if (!user) {
        message.error('Thông tin đăng nhập hoặc vai trò không chính xác.');
        return;
      }
      message.success('Đăng nhập thành công! Chào mừng đến với Akademi.');
      onLogin?.(user);
    } catch (error) {
      message.error(`Không thể xác thực tài khoản. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const roleTabItems = [
    { key: 'principal', label: 'Ban Giám Hiệu' },
    { key: 'teacher', label: 'Giáo Viên' },
    { key: 'student', label: 'Học Sinh / Phụ Huynh' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #091e3a 0%, #1e3c72 50%, #2a5298 100%)',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background circles */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(24,144,255,0.2) 0%, rgba(24,144,255,0) 70%)',
          top: '-120px',
          right: '-100px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(114,46,209,0.25) 0%, rgba(114,46,209,0) 70%)',
          bottom: '-100px',
          left: '-80px',
          pointerEvents: 'none',
        }}
      />

      <Card
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: '36px 32px' } }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              color: '#fff',
              fontSize: '28px',
              marginBottom: '12px',
              boxShadow: '0 8px 16px rgba(24, 144, 255, 0.35)',
            }}
          >
            🎓
          </div>
          <Title level={3} style={{ margin: '0 0 4px', color: '#1a1a1a', fontWeight: '700' }}>
            Akademi
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            Hệ thống Quản lý Giáo dục & Nhà trường
          </Text>
        </div>

        {/* Role Selector Tabs */}
        <Tabs
          activeKey={role}
          onChange={setRole}
          centered
          items={roleTabItems}
          style={{ marginBottom: '16px' }}
        />

        {/* Form */}
        <Form
          form={form}
          name="loginForm"
          layout="vertical"
          initialValues={{
            remember: false,
          }}
          onFinish={handleFinish}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            label="Tên đăng nhập hoặc Email"
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập hoặc email!' },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined style={{ color: '#1890ff', marginRight: '6px' }} />}
              placeholder="Nhập tên đăng nhập"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: '#1890ff', marginRight: '6px' }} />}
              placeholder="Nhập mật khẩu"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              icon={<ArrowRightOutlined />}
              style={{
                height: '46px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                borderColor: '#1890ff',
                fontSize: '15px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
