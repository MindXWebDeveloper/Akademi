import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Space,
  Table,
  Typography,
} from 'antd';
import { ClearOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { getRecordDefinition, getRecords } from '../../data/schoolRecords';

const RecordList = ({ type }) => {
  const definition = getRecordDefinition(type);
  const [form] = Form.useForm();
  const [results, setResults] = useState(null);
  const [warning, setWarning] = useState('');
  const navigate = useNavigate();

  const search = (values) => {
    const filters = definition.searchableFields
      .map(({ name }) => [name, values[name]?.trim().toLocaleLowerCase('vi')])
      .filter(([, value]) => value);

    if (!filters.length) {
      setResults(null);
      setWarning(`Nhập ít nhất một điều kiện để tìm ${definition.singular}.`);
      return;
    }

    setWarning('');
    setResults(getRecords(type).filter((record) => filters.every(([name, value]) => (
      String(record[name] ?? '').toLocaleLowerCase('vi').includes(value)
    ))));
  };

  const reset = () => {
    form.resetFields();
    setResults(null);
    setWarning('');
  };

  const columns = [
    ...definition.columns,
    {
      title: 'Thao tác',
      key: 'action',
      width: 110,
      render: (_, record) => (
        <Link className="ant-btn ant-btn-link" to={`${definition.route}/${record.id}`}>
          Chi tiết
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>{definition.title}</Typography.Title>
          <Typography.Text type="secondary">Tìm kiếm, xem và cập nhật thông tin.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`${definition.route}/new`)}>
          Thêm {definition.singular}
        </Button>
      </div>

      <Card title="Điều kiện tìm kiếm" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={search} onValuesChange={() => setWarning('')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
            {definition.searchableFields.map((field) => (
              <Form.Item key={field.name} label={field.label} name={field.name} style={{ marginBottom: 0 }}>
                <Input allowClear placeholder={field.placeholder} />
              </Form.Item>
            ))}
          </div>
          {warning && <Alert type="warning" showIcon message={warning} style={{ marginTop: 16 }} />}
          <Space style={{ marginTop: 20 }}>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>Tìm kiếm</Button>
            <Button icon={<ClearOutlined />} onClick={reset}>Xóa điều kiện</Button>
          </Space>
        </Form>
      </Card>

      {results === null ? (
        <Card><Empty description={`Nhập ít nhất một điều kiện để hiển thị ${definition.singular}.`} /></Card>
      ) : results.length === 0 ? (
        <Card><Empty description={`Không tìm thấy ${definition.singular} phù hợp.`} /></Card>
      ) : (
        <Card title={`Kết quả (${results.length})`} styles={{ body: { padding: 0 } }}>
          <Table rowKey="id" columns={columns} dataSource={results} pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }} />
        </Card>
      )}
    </div>
  );
};

export default RecordList;
