import { useState } from 'react';
import {
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
  BarsOutlined,
  BellOutlined,
  SearchOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, Button, Space, Input, message } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;

const menuItems = [
  { key: '1', icon: <UserOutlined />, label: 'Tổng quan' },
  { key: '2', icon: <UserOutlined />, label: 'Học sinh', children: [{ key: '2-1', label: 'Quản lý học sinh' }] },
  { key: '3', icon: <UserOutlined />, label: 'Giáo viên', children: [{ key: '3-1', label: 'Quản lý giáo viên' }] },
  { key: '4', icon: <BarsOutlined />, label: 'Lớp học', children: [{ key: '4-1', label: 'Quản lý lớp học' }] },
  { key: '5', icon: <BarsOutlined />, label: 'Thời khóa biểu' },
  { key: '6', icon: <VideoCameraOutlined />, label: 'Hoạt động ngoài khóa' },
  { key: '7', icon: <BellOutlined />, label: 'Thông báo' },
  { key: '8', icon: <BarsOutlined />, label: 'Báo cáo' },
  { key: '9', icon: <BarsOutlined />, label: 'Tài chính' },
  { key: '10', icon: <UploadOutlined />, label: 'Tài sản' },
  { key: '11', icon: <UserOutlined />, label: 'Thư viện' },
  { key: '12', icon: <UserOutlined />, label: 'Cơ sở vật chất' },
  { key: '13', icon: <UserOutlined />, label: 'Nhân sự' },
  { key: '14', icon: <UserOutlined />, label: 'Học phí' },
  { key: '15', icon: <BarsOutlined />, label: 'Chương trình học' },
  { key: '16', icon: <BellOutlined />, label: 'Hỗ trợ' },
  { key: '17', icon: <UserOutlined />, label: 'Cài đặt' },
  { key: '18', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
];

const AuthenticatedLayout = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isStudentRoute = location.pathname.startsWith('/students');
  const isTeacherRoute = location.pathname.startsWith('/teachers');
  const isClassRoute = location.pathname.startsWith('/classes');
  const isTimetableRoute = location.pathname.startsWith('/timetable');
  const activeGroupKey = isStudentRoute ? '2' : isTeacherRoute ? '3' : isClassRoute ? '4' : null;
  const activeItemKey = isStudentRoute ? '2-1' : isTeacherRoute ? '3-1' : isClassRoute ? '4-1' : isTimetableRoute ? '5' : '1';
  const [isMobile, setIsMobile] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleMenuClick = ({ key }) => {
    const closeMobileSubmenu = () => {
      if (isMobile) setOpenKeys([]);
    };

    if (key === '18') {
      message.info('Đã đăng xuất');
      closeMobileSubmenu();
      onLogout?.();
      return;
    }

    if (key === '1') {
      navigate('/dashboard');
      closeMobileSubmenu();
    } else if (key === '2-1') {
      navigate('/students');
      closeMobileSubmenu();
    } else if (key === '3-1') {
      navigate('/teachers');
      closeMobileSubmenu();
    } else if (key === '4-1') {
      navigate('/classes');
      closeMobileSubmenu();
    } else if (key === '5') {
      navigate('/timetable');
      closeMobileSubmenu();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', width: '100%' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        onBreakpoint={(broken) => {
          setIsMobile(broken);
          if (broken) setOpenKeys([]);
        }}
      >
        <div style={{ padding: '16px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#1890ff', letterSpacing: '1px' }}>
          🎓 Akademi
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeItemKey]}
          openKeys={isMobile ? openKeys : activeGroupKey ? [...new Set([...openKeys, activeGroupKey])] : openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Input
            placeholder="Tìm kiếm thông tin học sinh, lớp học..."
            prefix={<SearchOutlined style={{ color: '#aaa' }} />}
            style={{ width: '320px', borderRadius: '6px' }}
          />
          <Space size="middle">
            <BellOutlined style={{ fontSize: '18px', cursor: 'pointer', color: '#666' }} />
            <UserOutlined style={{ fontSize: '18px', cursor: 'pointer', color: '#666' }} />
            {onLogout && (
              <Button
                type="dashed"
                danger
                size="small"
                icon={<LogoutOutlined />}
                onClick={() => {
                  message.info('Đã đăng xuất');
                  onLogout();
                }}
              >
                Đăng xuất
              </Button>
            )}
          </Space>
        </Header>
        <Content style={{ flex: '1', overflow: 'auto', padding: '24px', background: '#f5f5f5' }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', marginTop: 'auto', background: '#fff', color: '#8c8c8c' }}>
          Akademi ©{new Date().getFullYear()} Hệ thống Quản lý Nhà trường Toàn diện
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AuthenticatedLayout;