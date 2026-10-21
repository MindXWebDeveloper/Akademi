import { useEffect, useState } from 'react';
import {
  UserOutlined,
  BarsOutlined,
  LogoutOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, Button, Space, message } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getMenuAccess, hideableMenus } from '../../data/roleAccess';
import './AuthenticatedLayout.css';

const { Header, Content, Footer, Sider } = Layout;

const menuItems = [
  { key: 'dashboard', icon: <UserOutlined />, label: 'Tổng quan' },
  { key: 'students-group', icon: <UserOutlined />, label: 'Học sinh', children: [
    { key: 'students', label: 'Quản lý học sinh' },
    { key: 'class-promotions', label: 'Sắp lớp' },
  ] },
  { key: 'subjects', icon: <BookOutlined />, label: 'Môn học' },
  { key: 'teachers-group', icon: <UserOutlined />, label: 'Giáo viên', children: [{ key: 'teachers', label: 'Quản lý giáo viên' }] },
  { key: 'classes-group', icon: <BarsOutlined />, label: 'Lớp học', children: [{ key: 'classes', label: 'Quản lý lớp học' }] },
  { key: 'timetable', icon: <BarsOutlined />, label: 'Thời khóa biểu' },
  // { key: 'roles', icon: <UserOutlined />, label: 'Phân quyền' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
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
  const isSubjectManagement = location.pathname === '/subjects';
  const isTimetableRoute = location.pathname.startsWith('/timetable');
  const isPersonalProfileRoute = location.pathname === '/profile';
  const isTeacherManagementRoute = location.pathname.startsWith('/teachers');
  const routeAccess = restrictedMenuKey ? getMenuAccess(roleKey, restrictedMenuKey) : 'edit';
  const isForbidden = Boolean(
    (restrictedMenuKey && routeAccess === 'hide')
    || (isSubjectManagement && roleKey !== 'principal')
    || (isTeacherManagementRoute && roleKey !== 'principal')
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
  const isSubjectRoute = location.pathname.startsWith('/subjects');
  const isPromotionRoute = location.pathname.startsWith('/class-promotions');
  const activeGroupKey = isStudentRoute || isPromotionRoute
    ? 'students-group'
    : isTeacherRoute
      ? 'teachers-group'
      : isClassRoute
        ? 'classes-group'
        : null;
  const activeItemKey = isPromotionRoute
    ? 'class-promotions'
    : isStudentRoute
      ? 'students'
      : isTeacherRoute
        ? 'teachers'
        : isClassRoute
          ? 'classes'
          : isTimetableRoute
            ? 'timetable'
            : isActivityRoute
              ? 'activities'
              : isNoticeRoute
                ? 'notices'
                : isLibraryRoute
                  ? 'library'
                  : isSubjectRoute
                    ? 'subjects'
                    : location.pathname === '/roles'
                      ? 'roles'
                      : 'dashboard';
  const [isMobile, setIsMobile] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const visibleMenuItems = menuItems.flatMap((item) => {
    if (item.key === 'roles' || item.key === 'subjects') {
      return roleKey === 'principal' ? [item] : [];
    }
    if (item.children) {
      const children = item.children.filter((child) => {
        return getMenuAccess(roleKey, child.key) !== 'hide';
      });
      return children.length ? [{ ...item, children }] : [];
    }
    if (!hideableMenus.some(({ key }) => key === item.key)) return [item];
    return getMenuAccess(roleKey, item.key) !== 'hide' ? [item] : [];
  });

  const handleMenuClick = ({ key }) => {
    const closeMobileSubmenu = () => {
      if (isMobile) setOpenKeys([]);
    };

    if (key === 'logout') {
      message.info('Đã đăng xuất');
      closeMobileSubmenu();
      onLogout?.();
      return;
    }

    const menuRoutes = {
      dashboard: '/dashboard',
      students: '/students',
      'class-promotions': '/class-promotions',
      teachers: '/teachers',
      classes: '/classes',
      timetable: '/timetable',
      activities: '/activities',
      notices: '/notices',
      library: '/library',
      subjects: '/subjects',
      roles: '/roles',
    };
    const route = menuRoutes[key];
    if (route) {
      navigate(route);
      closeMobileSubmenu();
    }
  };

  if (isForbidden) return null;

  return (
    <Layout style={{ minHeight: '100vh', width: '100%' }}>
      <Sider
        className="authenticated-sidebar"
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
      <Layout className="authenticated-main-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header className="authenticated-header" style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Space size="middle">
            <Button
              type="text"
              aria-label="Thông tin cá nhân"
              title="Thông tin cá nhân"
              icon={<UserOutlined style={{ fontSize: '18px', color: '#666' }} />}
              onClick={() => navigate('/profile', { replace: true })}
            />
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