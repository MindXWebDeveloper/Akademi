import {
  UserOutlined,
  BarsOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { Row, Col, Card, Statistic, Button, Table, Tag, Space } from 'antd';

const chartData = [
  { month: 'Tháng 12', value: 1000 },
  { month: 'Tháng 1', value: 900 },
  { month: 'Tháng 2', value: 850 },
  { month: 'Tháng 3', value: 950 },
  { month: 'Tháng 4', value: 1100 },
  { month: 'Tháng 5', value: 1200 },
];

const activityData = [
  { key: 1, time: '31/05/2024 - 09:00', activity: 'Họp ban giám hiệu', location: 'Phòng họp A', people: 'Hiệu trưởng', status: 'Sắp diễn ra' },
  { key: 2, time: '02/06/2024 - 08:00', activity: 'Kiểm tra chất lượng học kỳ II', location: 'Các lớp học', people: 'Phó hiệu trưởng', status: 'Sắp diễn ra' },
  { key: 3, time: '05/06/2024 - 14:00', activity: 'Hoạt động ngoài khóa: Kỹ năng mềm', location: 'Sân trường', people: 'Đoàn trường', status: 'Đã lên kế hoạch' },
];

const Dashboard = ({ user }) => {
  const displayName = user?.username ? (user.username === 'admin' ? 'Hiệu trưởng' : user.username) : 'Hiệu trưởng';

  return (
    <>
          {/* Greeting Section */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 4px', color: '#262626' }}>Xin chào, {displayName}!</h2>
            <p style={{ color: '#666', margin: 0 }}>Tổng quan hoạt động của nhà trường hôm nay.</p>
          </div>

          {/* Statistics Cards */}
          <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ borderRadius: '8px' }}>
                <Statistic
                  title="Học sinh"
                  value={1248}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  suffix={<span style={{ fontSize: '12px', color: '#52c41a' }}>↑ 12 so với tháng trước</span>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ borderRadius: '8px' }}>
                <Statistic
                  title="Giáo viên"
                  value={96}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix={<span style={{ fontSize: '12px', color: '#52c41a' }}>↑ 5 so với tháng trước</span>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ borderRadius: '8px' }}>
                <Statistic
                  title="Lớp học"
                  value={36}
                  prefix={<BarsOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                  suffix={<span style={{ fontSize: '12px', color: '#52c41a' }}>↑ 2 so với tháng trước</span>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ borderRadius: '8px' }}>
                <Statistic
                  title="Thông báo chưa đọc"
                  value={8}
                  prefix={<BellOutlined />}
                  valueStyle={{ color: '#ff7a45' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Chart and Announcements */}
          <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
            <Col xs={24} md={14}>
              <Card
                title="Biểu đồ tổng quan học sinh"
                extra={<span style={{ fontSize: '12px', color: '#666' }}>6 tháng qua</span>}
                style={{ borderRadius: '8px', height: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '300px', gap: '16px', paddingBottom: '20px' }}>
                  {chartData.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: '32px',
                        height: `${(item.value / 1200) * 230}px`,
                        background: 'linear-gradient(180deg, #40a9ff 0%, #1890ff 100%)',
                        borderRadius: '6px 6px 0 0',
                        marginBottom: '8px',
                        transition: 'height 0.3s ease',
                      }}></div>
                      <span style={{ fontSize: '12px', textAlign: 'center', color: '#666' }}>{item.month}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} md={10}>
              <Card
                title="Thông báo mới nhất"
                extra={<a href="#all-announcements" style={{ color: '#1890ff' }}>Xem tất cả</a>}
                style={{ borderRadius: '8px', height: '100%' }}
              >
                <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                  <div style={{ orientation: 'vertical', width: '100%', padding: '14px', background: '#f0f5ff', borderRadius: '6px', borderLeft: '4px solid #1890ff' }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#1f1f1f' }}>Họp ban giám hiệu tháng 6</p>
                    <p style={{ margin: '0', fontSize: '13px', color: '#595959' }}>Cuộc họp sẽ diễn ra vào 09:00 sáng mai tại phòng họp A</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#8c8c8c' }}>10 phút trước</p>
                  </div>
                  <div style={{ orientation: 'vertical', width: '100%', padding: '14px', background: '#fff1f0', borderRadius: '6px', borderLeft: '4px solid #ff4d4f' }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#1f1f1f' }}>Thông báo nghỉ lễ 30/4 - 1/5</p>
                    <p style={{ margin: '0', fontSize: '13px', color: '#595959' }}>Nhà trường thông báo lịch nghỉ lễ 30/4 và 01/5.</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#8c8c8c' }}>2 giờ trước</p>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Quick Access */}
          <Card title="Truy cập nhanh" style={{ marginBottom: '24px', borderRadius: '8px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={4}>
                <Button type="dashed" block icon={<UserOutlined />} style={{ height: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '8px' }}>
                  <span>Quản lý học sinh</span>
                </Button>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Button type="dashed" block icon={<UserOutlined />} style={{ height: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '8px' }}>
                  <span>Quản lý giáo viên</span>
                </Button>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Button type="dashed" block icon={<BarsOutlined />} style={{ height: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '8px' }}>
                  <span>Quản lý lớp học</span>
                </Button>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Button type="dashed" block icon={<BarsOutlined />} style={{ height: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '8px' }}>
                  <span>Thời khóa biểu</span>
                </Button>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Button type="dashed" block icon={<BarsOutlined />} style={{ height: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '8px' }}>
                  <span>Báo cáo</span>
                </Button>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Button type="dashed" block icon={<BellOutlined />} style={{ height: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '8px' }}>
                  <span>Thông báo</span>
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Activity Log */}
          <Card title="Lịch hoạt động sắp tới" extra={<a href="#all-activities" style={{ color: '#1890ff' }}>Xem tất cả</a>} style={{ borderRadius: '8px' }}>
            <Table
              columns={[
                { title: 'Thời gian', dataIndex: 'time', key: 'time' },
                { title: 'Nội dung', dataIndex: 'activity', key: 'activity' },
                { title: 'Địa điểm', dataIndex: 'location', key: 'location' },
                { title: 'Người phụ trách', dataIndex: 'people', key: 'people' },
                {
                  title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (text) => (
                    text === 'Sắp diễn ra' ? <Tag color="blue">{text}</Tag> : <Tag color="green">{text}</Tag>
                  )
                },
              ]}
              dataSource={activityData}
              pagination={false}
            />
          </Card>
    </>
  );
};

export default Dashboard;
