import { useEffect, useState } from 'react';
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
import { getMenuAccess } from '../../data/roleAccess';

const { Header, Content, Footer, Sider } = Layout;

const menuItems = [
  { key: '1', icon: <UserOutlined />, label: 'Tổng quan' },
  { key: '2', icon: <UserOutlined />, label: 'Học sinh', children: [
    { key: '2-1', label: 'Quản lý học sinh' },
    { key: '2-2', label: 'Sắp lớp' },
  ] },
  { key: '3', icon: <UserOutlined />, label: 'Giáo viên', children: [{ key: '3-1', label: 'Quản lý giáo viên' }] },
  { key: '4', icon: <BarsOutlined />, label: 'Lớp học', children: [{ key: '4-1', label: 'Quản lý lớp học' }] },
  { key: '5', icon: <BarsOutlined />, label: 'Thời khóa biểu' },
  { key: '6', icon: <VideoCameraOutlined />, label: 'Hoạt động ngoài khóa' },
  { key: '7', icon: <BellOutlined />, label: 'Thông báo' },
  { key: '8', icon: <UserOutlined />, label: 'Thư viện' },
  { key: '9', icon: <UserOutlined />, label: 'Phân quyền' },
  { key: '10', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
];

const AuthenticatedLayout = ({ onLogout, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const roleKey = user?.role;
  const [, setRoleRevision] = useState(0);
  useEffect(() => {
    const refreshRoleAccess = () => setRoleRevision((revision) => revision + 1);
    window.addEventListener('akademi:roles-updated', refreshRoleAccess);
    return () => window.removeEventListener('akademi:roles-updated', refreshRoleAccess);
  }, []);
  const routeMenuKeys = [
    ['/students', 'students'],
    ['/class-promotions', 'class-promotions'],
    ['/teachers', 'teachers'],
    ['/classes', 'classes'],
    ['/timetable', 'timetable'],
    ['/activities', 'activities'],
    ['/notices', 'notices'],
    ['/library', 'library'],
  ];
  const restrictedMenuKey = routeMenuKeys.find(([path]) => (
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  ))?.[1];
  const isRoleManagement = location.pathname === '/roles';
  const isTimetableRoute = location.pathname.startsWith('/timetable');
  const isPersonalProfileRoute = location.pathname === '/profile';
  const isPersonalDataManagementRoute = location.pathname.startsWith('/students')
    || location.pathname.startsWith('/teachers');
  const routeAccess = restrictedMenuKey ? getMenuAccess(roleKey, restrictedMenuKey) : 'edit';
  const isForbidden = Boolean(
    (restrictedMenuKey && routeAccess === 'hide')
    || (isPersonalDataManagementRoute && roleKey !== 'principal')
    || (isRoleManagement && roleKey !== 'principal'),
  );
  const isReadOnly = routeAccess === 'read' && !isForbidden;
  useEffect(() => {
    if (isForbidden) {
      message.error('Bạn không có quyền truy cập trang này.');
      navigate('/dashboard', { replace: true });
    }
  }, [isForbidden, navigate]);
  const isStudentRoute = location.pathname.startsWith('/students');
  const isTeacherRoute = location.pathname.startsWith('/teachers');
  const isClassRoute = location.pathname.startsWith('/classes');
  const isActivityRoute = location.pathname.startsWith('/activities');
  const isLibraryRoute = location.pathname.startsWith('/library');
  const isNoticeRoute = location.pathname.startsWith('/notices');
  const isPromotionRoute = location.pathname.startsWith('/class-promotions');
  const activeGroupKey = isStudentRoute || isPromotionRoute ? '2' : isTeacherRoute ? '3' : isClassRoute ? '4' : null;
  const activeItemKey = isPromotionRoute ? '2-2' : isStudentRoute ? '2-1' : isTeacherRoute ? '3-1' : isClassRoute ? '4-1' : isTimetableRoute ? '5' : isActivityRoute ? '6' : isNoticeRoute ? '7' : isLibraryRoute ? '11' : '1';
  const [isMobile, setIsMobile] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const visibleMenuItems = menuItems.flatMap((item) => {
    if (item.key === '17') return roleKey === 'principal' ? [item] : [];
    if (item.children) {
      const children = item.children.filter((child) => {
        if (child.key === '2-1') return getMenuAccess(roleKey, 'students') !== 'hide';
        if (child.key === '2-2') return getMenuAccess(roleKey, 'class-promotions') !== 'hide';
        if (child.key === '3-1') return getMenuAccess(roleKey, 'teachers') !== 'hide';
        if (child.key === '4-1') return getMenuAccess(roleKey, 'classes') !== 'hide';
        return true;
      });
      return children.length ? [{ ...item, children }] : [];
    }
    const menuAccessKey = {
      5: 'timetable',
      6: 'activities',
      7: 'notices',
      11: 'library',
    }[item.key];
    return !menuAccessKey || getMenuAccess(roleKey, menuAccessKey) !== 'hide' ? [item] : [];
  });

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
    } else if (key === '2-2') {
      navigate('/class-promotions');
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
    } else if (key === '6') {
      navigate('/activities');
      closeMobileSubmenu();
    } else if (key === '7') {
      navigate('/notices');
      closeMobileSubmenu();
    } else if (key === '11') {
      navigate('/library');
      closeMobileSubmenu();
    } else if (key === '17') {
      navigate('/roles');
      closeMobileSubmenu();
    }
  };

  if (isForbidden) return null;

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
          Akademi
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeItemKey]}
          openKeys={isMobile ? openKeys : activeGroupKey ? [...new Set([...openKeys, activeGroupKey])] : openKeys}
          onOpenChange={setOpenKeys}
          items={visibleMenuItems}
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
            <Button
              type="text"
              aria-label="Thông tin cá nhân"
              title="Thông tin cá nhân"
              icon={<UserOutlined style={{ fontSize: '18px', color: '#666' }} />}
              onClick={() => navigate('/profile', { replace: true })}
            />
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
          {isReadOnly && (
            <div style={{ marginBottom: 16 }}>
              Bạn đang ở chế độ chỉ đọc.
            </div>
          )}
          <div inert={(isReadOnly && !isTimetableRoute && !isPersonalProfileRoute) || undefined}>
            <Outlet context={{ isReadOnly, user }} />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', marginTop: 'auto', background: '#fff', color: '#8c8c8c' }}>
          Akademi ©{new Date().getFullYear()} Hệ thống Quản lý Nhà trường Toàn diện
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AuthenticatedLayout;