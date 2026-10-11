import { useState } from 'react';
import { Alert, Button, Card, message, Radio, Space, Table, Typography } from 'antd';
import { createResourceRecord, updateResourceRecord } from '../../data/apiClient';
import { getMenuAccess, getRoleRecord, hideableMenus, roleDefinitions } from '../../data/roleAccess';

const accessOptions = [
  { label: 'Ẩn', value: 'hide' },
  { label: 'Chỉ đọc', value: 'read' },
  { label: 'Chỉnh sửa', value: 'edit' },
];

const RoleManagement = () => {
  const [selectedRoleKey, setSelectedRoleKey] = useState(roleDefinitions[0].roleKey);
  const [menuAccess, setMenuAccess] = useState(() => Object.fromEntries(
    hideableMenus.map(({ key }) => [key, getMenuAccess(roleDefinitions[0].roleKey, key)]),
  ));
  const [saving, setSaving] = useState(false);
  const selectedRole = roleDefinitions.find((role) => role.roleKey === selectedRoleKey);
  const roleRecord = getRoleRecord(selectedRoleKey);

  const selectRole = (roleKey) => {
    setSelectedRoleKey(roleKey);
    setMenuAccess(Object.fromEntries(
      hideableMenus.map(({ key }) => [key, getMenuAccess(roleKey, key)]),
    ));
  };

  const save = async () => {
    setSaving(true);
    const record = {
      ...roleRecord,
      roleKey: selectedRoleKey,
      name: selectedRole.name,
      menuAccess,
    };
    try {
      if (roleRecord) await updateResourceRecord('roles', record);
      else await createResourceRecord('roles', record);
      window.dispatchEvent(new Event('akademi:roles-updated'));
      message.success(`Đã lưu cấu hình menu cho vai trò ${selectedRole.name}.`);
    } catch (error) {
      message.error(`Không thể lưu cấu hình vai trò. ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Cấu hình menu theo vai trò">
      <Typography.Paragraph>
        Chọn quyền cho từng menu. Menu để Ẩn hoặc chưa được cấu hình sẽ không hiển thị;
        truy cập URL trực tiếp cũng bị chặn và chuyển về trang tổng quan.
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 20 }}>
        {roleDefinitions.map((role) => (
          <Button
            key={role.roleKey}
            type={role.roleKey === selectedRoleKey ? 'primary' : 'default'}
            onClick={() => selectRole(role.roleKey)}
          >
            {role.name}
          </Button>
        ))}
      </Space>
      {!roleRecord && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Vai trò chưa có cấu hình trên API. Lưu để tạo record mới."
        />
      )}
      <Table
        rowKey="key"
        pagination={false}
        dataSource={hideableMenus}
        columns={[
          { title: 'Menu', dataIndex: 'label', key: 'label' },
          {
            title: 'Quyền truy cập',
            key: 'access',
            render: (_, item) => (
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={accessOptions}
                value={menuAccess[item.key] ?? 'hide'}
                onChange={(event) => setMenuAccess((current) => ({
                  ...current,
                  [item.key]: event.target.value,
                }))}
              />
            ),
          },
        ]}
        style={{ marginBottom: 24 }}
      />
      <Button type="primary" loading={saving} onClick={save}>
        Lưu cấu hình
      </Button>
    </Card>
  );
};

export default RoleManagement;
