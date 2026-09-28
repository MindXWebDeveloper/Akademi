import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarOutlined, EnvironmentOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { getActivities } from '../../data/extracurricularActivities';

const formatDateTime = (value) => {
  if (!value) return 'Chưa xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getActivityStatus = (activity) => {
  if (!activity.registrationOpen) return { label: 'Đã đóng đăng ký', color: 'default' };
  if (new Date(activity.endAt) < new Date()) return { label: 'Đã kết thúc', color: 'blue' };
  if (new Date(activity.startAt) <= new Date()) return { label: 'Đang diễn ra', color: 'green' };
  return { label: 'Mở đăng ký', color: 'gold' };
};

const ExtracurricularActivities = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const activities = getActivities();
  const filteredActivities = useMemo(() => activities.filter((activity) => {
    const query = search.trim().toLocaleLowerCase('vi');
    const matchesQuery = !query || [activity.title, activity.location, activity.description]
      .some((value) => value?.toLocaleLowerCase('vi').includes(query));
    const isOpen = activity.registrationOpen && new Date(activity.endAt) >= new Date();
    return matchesQuery && (statusFilter === 'all' || (statusFilter === 'open' ? isOpen : !isOpen));
  }), [activities, search, statusFilter]);

  const columns = [
    {
      title: 'Hoạt động',
      dataIndex: 'title',
      key: 'title',
      render: (title, activity) => (
        <div>
          <Typography.Link strong onClick={() => navigate(`/activities/${activity.id}`)}>{title}</Typography.Link>
          <Typography.Paragraph type="secondary" ellipsis={{ rows: 1 }} style={{ margin: '4px 0 0', maxWidth: 440 }}>
            {activity.description || 'Chưa có mô tả'}
          </Typography.Paragraph>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'startAt',
      key: 'time',
      render: (_, activity) => (
        <Space direction="vertical" size={2}>
          <span><CalendarOutlined /> {formatDateTime(activity.startAt)}</span>
          <Typography.Text type="secondary">đến {formatDateTime(activity.endAt)}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      render: (location) => <span><EnvironmentOutlined /> {location}</span>,
    },
    {
      title: 'Đăng ký',
      key: 'registration',
      render: (_, activity) => {
        const participants = activity.participants ?? {};
        const count = participants.students?.length ?? 0;
        const status = getActivityStatus(activity);
        return (
          <Space direction="vertical" size={2}>
            <Tag color={status.color}>{status.label}</Tag>
            <Typography.Text type="secondary">
              <TeamOutlined /> {count}{activity.capacity ? ` / ${activity.capacity}` : ''} học sinh
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 120,
      render: (_, activity) => <Button type="link" onClick={() => navigate(`/activities/${activity.id}`)}>Chi tiết</Button>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>Hoạt động ngoài khóa</Typography.Title>
          <Typography.Text type="secondary">Quản lý lịch hoạt động và danh sách người tham gia.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/activities/new')}>Tạo hoạt động</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <Input.Search
          aria-label="Tìm hoạt động"
          placeholder="Tìm theo tên hoặc địa điểm"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 320, maxWidth: '100%' }}
        />
        <Select
          aria-label="Lọc trạng thái đăng ký"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'Tất cả hoạt động' },
            { value: 'open', label: 'Đang mở đăng ký' },
            { value: 'closed', label: 'Đã đóng / kết thúc' },
          ]}
          style={{ width: 200 }}
        />
      </div>

      {filteredActivities.length ? (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredActivities}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 850 }}
        />
      ) : (
        <Empty description={activities.length ? 'Không có hoạt động phù hợp.' : 'Chưa có hoạt động ngoài khóa.'}>
          {!activities.length && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/activities/new')}>Tạo hoạt động đầu tiên</Button>}
        </Empty>
      )}
    </div>
  );
};

export default ExtracurricularActivities;