import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Empty,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { CheckOutlined, CloseOutlined, FileSearchOutlined, PlusOutlined } from '@ant-design/icons';
import { getRecords } from '../../data/schoolRecords';
import {
  createNextSchoolYear,
  getCurrentSchoolYear,
  getSchoolYears,
  setCurrentSchoolYear,
} from '../../data/schoolYears';
import {
  approvePromotionPlan,
  createPromotionPlan,
  getPromotionPlans,
  updatePromotionPlanRows,
  rejectPromotionPlan,
} from '../../data/promotions';

const actionLabels = {
  promote: 'Lên lớp',
  graduate: 'Tốt nghiệp',
  hold: 'Giữ nguyên / tạm hoãn',
};

const ClassPromotions = () => {
  const navigate = useNavigate();
  const [, refresh] = useReducer((revision) => revision + 1, 0);
  const schoolYears = getSchoolYears();
  const currentSchoolYear = getCurrentSchoolYear();
  const promotionSourceYears = schoolYears.slice(0, -1);
  const initialSourceYear = promotionSourceYears.includes(currentSchoolYear)
    ? currentSchoolYear
    : promotionSourceYears.at(-1) ?? currentSchoolYear;
  const [sourceYear, setSourceYear] = useState(initialSourceYear);
  const plans = getPromotionPlans();
  const pendingPlans = plans.filter((plan) => plan.status === 'pending');
  const classes = getRecords('classes');
  const plan = pendingPlans[0];

  const generatePlan = async () => {
    const result = await createPromotionPlan(sourceYear);
    if (!result.saved) {
      message.warning(result.reason === 'pending-exists'
        ? 'Đã có phương án chờ duyệt cho năm học này.'
        : 'Không thể tạo phương án. Kiểm tra năm học và dữ liệu học sinh.');
      refresh();
      return;
    }
    message.success(`Đã tạo phương án ${result.plan.sourceYear} → ${result.plan.targetYear}.`);
    refresh();
  };

  const updateRow = async (studentId, updates) => {
    const rows = plan.rows.map((row) => (
      row.studentId === studentId ? { ...row, ...updates } : row
    ));
    const result = await updatePromotionPlanRows(plan.id, rows);
    if (!result.saved) {
      message.error(`Không thể lưu chỉnh sửa phương án.${result.error ? ` ${result.error.message}` : ''}`);
      return;
    }
    refresh();
  };

  const approvePlan = async () => {
    const result = await approvePromotionPlan(plan.id);
    if (!result.saved) {
      const errorMessages = {
        capacity: `Lớp ${result.className} vượt sức chứa. Điều chỉnh danh sách trước khi duyệt.`,
        'invalid-target': 'Có học sinh chưa được xếp vào lớp hợp lệ.',
      };
      message.error(errorMessages[result.reason]
        ?? (result.reason === 'partial-failure'
          ? `Duyệt phương án chưa hoàn tất tại bước ${result.stage}; một số thay đổi đã được ghi lại. ${result.error?.message ?? ''}`
          : 'Không thể duyệt phương án.'));
      refresh();
      return;
    }
    message.success(`Đã duyệt: xếp ${result.assignments} học sinh, tạo ${result.classesCreated} lớp mới.`);
    refresh();
  };

  const rejectPlan = async () => {
    const result = await rejectPromotionPlan(plan.id);
    if (!result.saved) {
      message.error(`Không thể từ chối phương án.${result.error ? ` ${result.error.message}` : ''}`);
      return;
    }
    message.info('Đã từ chối phương án. Phân lớp chính thức không thay đổi.');
    refresh();
  };

  const changeCurrentYear = async (value) => {
    const result = await setCurrentSchoolYear(value);
    if (!result.success) {
      const description = result.reason === 'partial-failure'
        ? `Cập nhật năm học chưa hoàn tất; một số bản ghi có thể đã thay đổi. ${result.error?.message ?? ''}`
        : result.reason === 'year-not-found'
          ? 'Năm học không tồn tại trên API.'
          : 'Không thể lưu năm học hiện tại.';
      message.error(description);
      return;
    }
    message.success(result.synced
      ? `Đã cập nhật API và đặt ${value} là năm học hiện tại.`
      : `Đã đặt ${value} là năm học hiện tại trên thiết bị này.`);
    refresh();
  };

  const addNextYear = async () => {
    const result = await createNextSchoolYear();
    if (!result.created) {
      const description = result.reason === 'exists'
          ? `Năm học ${result.schoolYear} đã tồn tại.`
          : result.error?.message ?? 'Không thể tạo năm học kế tiếp. Kiểm tra kết nối API.';
      message.error(description);
      return;
    }
    message.success(`Đã tạo năm học ${result.schoolYear} trên API.`);
    refresh();
  };

  const columns = [
    { title: 'Mã học sinh', dataIndex: 'studentId', key: 'studentId', width: 120 },
    { title: 'Họ và tên', dataIndex: 'studentName', key: 'studentName' },
    { title: 'Lớp hiện tại', dataIndex: 'sourceClassName', key: 'sourceClassName', width: 130 },
    {
      title: 'Kết quả đề xuất',
      dataIndex: 'action',
      key: 'action',
      width: 190,
      render: (action, row) => (
        <Select
          value={action}
          onChange={(value) => updateRow(row.studentId, {
            action: value,
            targetClassKey: value === 'promote'
              ? (row.targetClassKey || (row.suggestedClassName ? `new:${row.suggestedClassName}` : ''))
              : '',
          })}
          options={Object.entries(actionLabels).map(([value, label]) => ({ value, label }))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Lớp năm mới',
      dataIndex: 'targetClassKey',
      key: 'targetClassKey',
      width: 210,
      render: (targetClassKey, row) => {
        if (row.action !== 'promote') return <Typography.Text type="secondary">Không xếp lớp</Typography.Text>;
        const targetYearClasses = classes.filter((item) => item.schoolYear === plan.targetYear);
        const suggestedNames = plan.rows.map((item) => item.suggestedClassName).filter(Boolean);
        const options = [
          ...targetYearClasses.map((item) => ({ value: item.id, label: `${item.name} · đã có` })),
          ...[...new Set(suggestedNames)]
            .filter((name) => !targetYearClasses.some((item) => item.name === name))
            .map((name) => ({ value: `new:${name}`, label: `${name} · tạo khi duyệt` })),
        ];
        return (
          <Select
            value={targetClassKey || undefined}
            onChange={(value) => updateRow(row.studentId, { targetClassKey: value })}
            options={options}
            placeholder="Chọn lớp đích"
            style={{ width: '100%' }}
          />
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>Sắp lớp</Typography.Title>
          <Typography.Text type="secondary">Tạo phương án xếp lớp để quản trị viên rà soát và duyệt.</Typography.Text>
        </div>
        <Button onClick={() => navigate('/students')}>Danh sách học sinh</Button>
      </div>

      <Card title="Tạo phương án lên lớp" style={{ marginBottom: 24 }}>
        <Space wrap align="end" size="middle">
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Năm học nguồn</Typography.Text>
            <Select
              value={sourceYear}
              onChange={setSourceYear}
              options={promotionSourceYears.map((year) => ({ value: year, label: year }))}
              style={{ width: 180 }}
            />
          </div>
          <Typography.Text type="secondary">Năm học tiếp theo: {sourceYear.slice(0, 4) !== sourceYear.slice(5) ? `${Number(sourceYear.slice(0, 4)) + 1}-${Number(sourceYear.slice(5)) + 1}` : '—'}</Typography.Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={generatePlan}>Tạo phương án</Button>
        </Space>
        <Alert
          type="info"
          showIcon
          title="Phân lớp chính thức chỉ thay đổi sau khi bấm Duyệt. Lớp 12 được đề xuất tốt nghiệp; học sinh không ở trạng thái Đang học được giữ lại để quản trị viên quyết định."
          style={{ marginTop: 16 }}
        />
      </Card>

      <Card title="Quản lý năm học" style={{ marginBottom: 24 }}>
        <Space wrap align="end" size="middle">
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Năm học hiện tại</Typography.Text>
            <Select
              value={currentSchoolYear}
              onChange={changeCurrentYear}
              options={schoolYears.map((year) => ({ value: year, label: year }))}
              style={{ width: 190 }}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={addNextYear}>Tạo năm học kế tiếp</Button>
          <Typography.Text type="secondary">Các năm học đã tạo được giữ trong danh sách và có thể tra cứu lại.</Typography.Text>
        </Space>
        <div style={{ marginTop: 16 }}>
          <Typography.Text strong>Danh sách năm học: </Typography.Text>
          {schoolYears.map((year) => (
            <Tag key={year} color={year === currentSchoolYear ? 'blue' : 'default'}>
              {year}{year === currentSchoolYear ? ' · Hiện tại' : ''}
            </Tag>
          ))}
        </div>
      </Card>

      {plan ? (
        <Card
          title={`Rà soát phương án · ${plan.sourceYear} → ${plan.targetYear}`}
          extra={(
            <Space>
              <Popconfirm title="Từ chối phương án này? Phân lớp hiện tại sẽ không thay đổi." onConfirm={rejectPlan}>
                <Button danger icon={<CloseOutlined />}>Từ chối</Button>
              </Popconfirm>
              <Popconfirm title="Duyệt và áp dụng phân lớp năm học mới?" onConfirm={approvePlan}>
                <Button type="primary" icon={<CheckOutlined />}>Duyệt và áp dụng</Button>
              </Popconfirm>
            </Space>
          )}
          style={{ marginBottom: 24 }}
        >
          <Alert
            type="warning"
            showIcon
            title="Có thể chỉnh kết quả và lớp đích ngay trong bảng. Lớp có nhãn ‘tạo khi duyệt’ sẽ được tạo khi xác nhận."
            style={{ marginBottom: 16 }}
          />
          {plan.rows.length ? (
            <Table rowKey="studentId" columns={columns} dataSource={plan.rows} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 850 }} />
          ) : <Empty description={`Không có học sinh đã xếp lớp trong năm ${plan.sourceYear}.`} />}
        </Card>
      ) : (
        <Card><Empty image={<FileSearchOutlined />} description="Không có phương án chờ duyệt." /></Card>
      )}

      <Card title="Lịch sử phương án">
        {plans.length ? (
          <Table
            rowKey="id"
            pagination={{ pageSize: 6, showSizeChanger: false }}
            dataSource={plans}
            columns={[
              { title: 'Năm học', key: 'years', render: (_, item) => `${item.sourceYear} → ${item.targetYear}` },
              { title: 'Số học sinh', key: 'students', render: (_, item) => item.rows.length },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (status) => <Tag color={status === 'approved' ? 'green' : status === 'pending' ? 'gold' : 'default'}>
                  {status === 'approved' ? 'Đã duyệt' : status === 'pending' ? 'Chờ duyệt' : 'Đã từ chối'}
                </Tag>,
              },
              { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (value) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) },
            ]}
          />
        ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phương án nào." />}
      </Card>
    </div>
  );
};

export default ClassPromotions;