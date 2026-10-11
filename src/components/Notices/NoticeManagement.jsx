import { useReducer, useState } from 'react';
import { BellOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { createNotice, deleteNotice, getNotices, updateNotice } from '../../data/notices';

const noticeTypes = [
  { value: 'general', label: 'Thông báo chung' },
  { value: 'meeting', label: 'Thông báo họp' },
  { value: 'personal', label: 'Thông báo cá nhân' },
];

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
};

const NoticeManagement = () => {
  const [form] = Form.useForm();
  const [, refreshNotices] = useReducer((revision) => revision + 1, 0);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formType, setFormType] = useState('general');
  const notices = getNotices();
  const normalizedSearch = search.trim().toLocaleLowerCase('vi');
  const filteredNotices = notices.filter((notice) => (
    !normalizedSearch
    || [notice.title, notice.content, notice.recipient, notice.meetingRoom]
      .some((value) => value?.toLocaleLowerCase('vi').includes(normalizedSearch))
  ));

  const openCreate = () => {
    setEditingNotice(null);
    setFormType('general');
    form.resetFields();
    form.setFieldsValue({ type: 'general', important: false });
    setIsModalOpen(true);
  };

  const openEdit = (notice) => {
    setEditingNotice(notice);
    setFormType(notice.type);
    form.setFieldsValue(notice);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNotice(null);
    form.resetFields();
  };

  const saveNotice = (values) => {
    if (values.endDate < values.startDate) {
      form.setFields([{ name: 'endDate', errors: ['Ngày kết thúc phải từ ngày bắt đầu trở đi.'] }]);
      return;
    }

    const notice = {
      ...values,
      title: values.title.trim(),
      content: values.content.trim(),
      meetingRoom: values.type === 'meeting' ? values.meetingRoom?.trim() : '',
      recipient: values.type === 'personal' ? values.recipient?.trim() : '',
      important: Boolean(values.important),
    };
    const saved = editingNotice
      ? updateNotice(editingNotice.id, notice)
      : createNotice(notice);

    if (!saved) {
      message.error('Không thể lưu thông báo. Kiểm tra dung lượng lưu trữ của trình duyệt.');
      return;
    }

    message.success(editingNotice ? 'Đã cập nhật thông báo.' : 'Đã tạo thông báo.');
    closeModal();
    refreshNotices();
  };

  const handleDelete = (noticeId) => {
    if (!deleteNotice(noticeId)) {
      message.error('Không thể xóa thông báo.');
      return;
    }
    message.success('Đã xóa thông báo.');
    refreshNotices();
  };

  const columns = [
    {
      title: 'Thông báo',
      dataIndex: 'title',
      key: 'title',
      render: (title, notice) => (
        <div>
          <Space wrap size={6}>
            <Typography.Text strong>{title}</Typography.Text>
            {notice.important && <Tag color="red">Quan trọng</Tag>}
            <Tag>{noticeTypes.find((type) => type.value === notice.type)?.label ?? 'Thông báo'}</Tag>
          </Space>
          <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: '4px 0 0', maxWidth: 560 }}>
            {notice.content}
          </Typography.Paragraph>
          {notice.type === 'meeting' && <Typography.Text type="secondary">Phòng họp: {notice.meetingRoom}</Typography.Text>}
          {notice.type === 'personal' && <Typography.Text type="secondary">Người nhận: {notice.recipient}</Typography.Text>}
        </div>
      ),
    },
    {
      title: 'Thời gian hiển thị',
      key: 'dateRange',
      width: 230,
      render: (_, notice) => `${formatDate(notice.startDate)} – ${formatDate(notice.endDate)}`,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 130,
      render: (_, notice) => {
        const today = new Date().toISOString().slice(0, 10);
        if (today < notice.startDate) return <Tag color="blue">Sắp hiển thị</Tag>;
        if (today > notice.endDate) return <Tag>Đã hết hạn</Tag>;
        return <Tag color="green">Đang hiển thị</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, notice) => (
        <Space size={0}>
          <Button type="text" aria-label="Sửa thông báo" title="Sửa thông báo" icon={<EditOutlined />} onClick={() => openEdit(notice)} />
          <Popconfirm title="Xóa thông báo này?" onConfirm={() => handleDelete(notice.id)}>
            <Button type="text" danger aria-label="Xóa thông báo" title="Xóa thông báo" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>Quản lý thông báo</Typography.Title>
          <Typography.Text type="secondary">Tạo thông báo và quản lý thời gian hiển thị trên bảng tin.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tạo thông báo</Button>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Typography.Text type="secondary">{filteredNotices.length} / {notices.length} thông báo · mới nhất trước</Typography.Text>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            aria-label="Tìm thông báo"
            placeholder="Tìm theo tiêu đề, nội dung hoặc người nhận"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: 340, maxWidth: '100%' }}
          />
        </div>
        {filteredNotices.length ? (
          <Table rowKey="id" columns={columns} dataSource={filteredNotices} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 900 }} />
        ) : (
          <Empty description={notices.length ? 'Không tìm thấy thông báo phù hợp.' : 'Chưa có thông báo nào.'}>
            {!notices.length && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tạo thông báo đầu tiên</Button>}
          </Empty>
        )}
      </Card>

      <Modal
        title={<Space><BellOutlined />{editingNotice ? 'Chỉnh sửa thông báo' : 'Tạo thông báo'}</Space>}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingNotice ? 'Lưu thay đổi' : 'Đăng thông báo'}
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveNotice}
          onValuesChange={(changedValues) => {
            if (changedValues.type) setFormType(changedValues.type);
          }}
        >
          <Form.Item label="Loại thông báo" name="type" rules={[{ required: true }]}>
            <Select options={noticeTypes} />
          </Form.Item>
          <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, whitespace: true, message: 'Nhập tiêu đề thông báo.' }]}>
            <Input maxLength={140} placeholder="Tiêu đề ngắn gọn" />
          </Form.Item>
          <Form.Item label="Nội dung" name="content" rules={[{ required: true, whitespace: true, message: 'Nhập nội dung thông báo.' }]}>
            <Input.TextArea rows={4} maxLength={2000} showCount placeholder="Nội dung cần gửi" />
          </Form.Item>
          {formType === 'meeting' && (
            <Form.Item label="Phòng họp" name="meetingRoom" rules={[{ required: true, whitespace: true, message: 'Nhập phòng họp.' }]}>
              <Input maxLength={100} placeholder="Ví dụ: Phòng họp A" />
            </Form.Item>
          )}
          {formType === 'personal' && (
            <Form.Item label="Người được thông báo" name="recipient" rules={[{ required: true, whitespace: true, message: 'Nhập người nhận thông báo.' }]}>
              <Input maxLength={160} placeholder="Tên hoặc mã người nhận" />
            </Form.Item>
          )}
          <Space size="middle" align="start" style={{ display: 'flex' }}>
            <Form.Item label="Ngày bắt đầu" name="startDate" rules={[{ required: true, message: 'Chọn ngày bắt đầu.' }]} style={{ flex: 1 }}>
              <Input type="date" />
            </Form.Item>
            <Form.Item label="Ngày kết thúc" name="endDate" rules={[{ required: true, message: 'Chọn ngày kết thúc.' }]} style={{ flex: 1 }}>
              <Input type="date" />
            </Form.Item>
          </Space>
          <Form.Item label="Mức độ" name="important" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch checkedChildren="Quan trọng" unCheckedChildren="Thông thường" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NoticeManagement;