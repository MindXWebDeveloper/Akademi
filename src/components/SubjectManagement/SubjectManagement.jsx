import { useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  createResourceRecord,
  deleteResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from '../../data/apiClient';
import { getAllSubjects } from '../../data/subjects';

const generateSubjectKey = () => {
  const highestNumber = getAllSubjects().reduce((highest, subject) => {
    const match = /^SUB-(\d+)$/.exec(subject.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `SUB-${String(highestNumber + 1).padStart(3, '0')}`;
};

const SubjectManagement = () => {
  const [form] = Form.useForm();
  const [editingSubject, setEditingSubject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const subjects = getAllSubjects();

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSubject(null);
    form.resetFields();
  };

  const openCreateForm = () => {
    setEditingSubject(null);
    form.resetFields();
    setIsFormOpen(true);
  };

  const openEditForm = (subject) => {
    setEditingSubject(subject);
    form.setFieldsValue(subject);
    setIsFormOpen(true);
  };

  const saveSubject = async ({ name, description }) => {
    const normalizedName = name.trim();
    const duplicate = subjects.some((subject) => (
      subject.id !== editingSubject?.id
      && subject.name.toLocaleLowerCase('vi') === normalizedName.toLocaleLowerCase('vi')
    ));
    if (duplicate) {
      form.setFields([{ name: 'name', errors: ['Tên môn học đã tồn tại.'] }]);
      return;
    }

    setSaving(true);
    try {
      if (editingSubject) {
        await updateResourceRecord('subjects', {
          ...editingSubject,
          name: normalizedName,
          description: (description ?? '').trim(),
        });
        message.success('Đã cập nhật môn học.');
      } else {
        await createResourceRecord('subjects', {
          subjectKey: generateSubjectKey(),
          name: normalizedName,
          description: (description ?? '').trim(),
          isActive: true,
        });
        message.success('Đã thêm môn học.');
      }
      setRevision((current) => current + 1);
      closeForm();
    } catch (error) {
      message.error(`Không thể lưu môn học. ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const removeSubject = async (subject) => {
    const isAssignedToTeacher = getResourceRecords('teachers').some((teacher) => (
      (teacher.subjectKeys ?? []).map(String).includes(subject.id)
    ));
    const hasGrades = getResourceRecords('grades').some((grade) => (
      String(grade.subjectKey ?? '') === subject.id
      || grade.subject === subject.name
    ));
    if (isAssignedToTeacher || hasGrades) {
      message.error('Không thể xóa môn học đã được phân công cho giáo viên hoặc đã có dữ liệu điểm.');
      return;
    }

    try {
      await deleteResourceRecord('subjects', subject);
      setRevision((current) => current + 1);
      message.success('Đã xóa môn học.');
    } catch (error) {
      message.error(`Không thể xóa môn học. ${error.message}`);
    }
  };

  const columns = [
    //{ title: 'Mã môn học', dataIndex: 'id', key: 'id', width: 150 },
    { title: 'Tên môn học', dataIndex: 'name', key: 'name' },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (description) => description || '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 190,
      render: (_, subject) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditForm(subject)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa môn học?"
            description="Chỉ xóa được môn học chưa được phân công và chưa có điểm."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => removeSubject(subject)}
          >
            <Button type="link" danger> Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>Quản lý môn học</Typography.Title>
          <Typography.Text type="secondary">Danh mục môn học dùng cho phân công giảng dạy và nhập điểm.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
          Thêm môn học
        </Button>
      </div>
      <Card styles={{ body: { padding: 0 } }}>
        {subjects.length ? (
          <Table
            key={revision}
            rowKey="id"
            columns={columns}
            dataSource={subjects}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        ) : <Empty description="Chưa có môn học." style={{ padding: 32 }} />}
      </Card>
      <Modal
        title={editingSubject ? 'Cập nhật môn học' : 'Thêm môn học'}
        open={isFormOpen}
        onCancel={closeForm}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={saveSubject}>
          <Form.Item
            label="Tên môn học"
            name="name"
            rules={[{ required: true, whitespace: true, message: 'Nhập tên môn học.' }]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectManagement;
