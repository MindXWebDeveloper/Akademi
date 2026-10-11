import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import {
  createRecord,
  generateRecordId,
  getRecordById,
  getRecordDefinition,
  saveRecord,
} from '../../data/schoolRecords';
import { getCurrentSchoolYear, getSchoolYears } from '../../data/schoolYears';
import { getSubjects } from '../../data/subjects';
import { getResourceRecords } from '../../data/apiClient';

const isPrincipalTeacher = (teacher) => (
  teacher?.position?.toLocaleLowerCase('vi').includes('hiệu trưởng')
  || getResourceRecords('users').some((user) => (
    ['principal', 'admin', 'hiệu trưởng', 'ban giám hiệu'].includes(
      user.role?.trim().toLocaleLowerCase('vi'),
    )
    && String(user.teacherKey ?? user.TeacherKey ?? '') === String(teacher?.id ?? '')
  ))
);

const RecordForm = ({ type, isCreateMode = false, selfService = false, profileId }) => {
  const definition = getRecordDefinition(type);
  const { recordId } = useParams();
  const navigate = useNavigate();
  const activeRecordId = selfService ? profileId : recordId;
  const [searchParams] = useSearchParams();
  const requestedYear = searchParams.get('schoolYear') ?? getCurrentSchoolYear();
  const [form] = Form.useForm();
  const record = isCreateMode ? null : getRecordById(type, activeRecordId);
  const principalTeacher = type === 'teachers' && !isCreateMode && isPrincipalTeacher(record);
  const visibleFields = definition.fields.filter((field) => (
    !(principalTeacher && field.name === 'subjectKeys')
  ));
  const listRoute = type === 'classes'
    ? `${definition.route}?schoolYear=${record?.schoolYear ?? requestedYear}`
    : definition.route;

  useEffect(() => {
    if (isCreateMode) {
      form.resetFields();
      form.setFieldsValue({ id: generateRecordId(type) });
      if (type === 'classes') form.setFieldsValue({ schoolYear: requestedYear });
      return;
    }

    const currentRecord = getRecordById(type, activeRecordId);
    if (currentRecord) form.setFieldsValue(currentRecord);
  }, [activeRecordId, form, isCreateMode, requestedYear, type]);

  const onFinish = async (values) => {
    const normalizedRecord = {
      ...values,
      id: values.id.trim(),
      ...Object.fromEntries(Object.entries(values).map(([key, value]) => (
        [key, typeof value === 'string' ? value.trim() : value]
      ))),
    };
    const saved = isCreateMode
      ? await createRecord(type, normalizedRecord)
      : await saveRecord(type, activeRecordId, normalizedRecord);

    if (!saved.saved) {
      message.error(isCreateMode
        ? saved.reason === 'partial-failure'
          ? `Đã tạo hồ sơ giáo viên nhưng chưa tạo được tài khoản Users.${saved.username ? ` Username dự kiến: ${saved.username}; mật khẩu: ${saved.teacherCode}.` : ''} ${saved.error?.message ?? ''}`
          : `${definition.idLabel} đã tồn tại hoặc không thể lưu.${saved.error ? ` ${saved.error.message}` : ''}`
        : `Không thể lưu thông tin ${definition.singular}.${saved.error ? ` ${saved.error.message}` : ''}`);
      return;
    }

    message.success(isCreateMode
      ? `Đã thêm ${definition.singular}.`
      : `Đã cập nhật ${definition.singular}.`);
    if (isCreateMode && type === 'teachers') {
      message.info(`Tài khoản giáo viên: ${saved.username} · Mật khẩu: ${saved.teacherCode}`, 8);
    }
    if (selfService) {
      navigate('/profile', { replace: true });
      return;
    }
    navigate(type === 'classes'
      ? `${definition.route}?schoolYear=${normalizedRecord.schoolYear}`
      : definition.route);
  };

  if (!record && !isCreateMode) {
    return (
      <Card>
        <Alert
          type="warning"
          showIcon
          message={`Không tìm thấy ${definition.singular}`}
          description={`${definition.idLabel} ${activeRecordId} không tồn tại.`}
          action={<Button onClick={() => navigate(selfService ? '/dashboard' : listRoute)}>Về ${selfService ? 'tổng quan' : 'danh sách'}</Button>}
        />
      </Card>
    );
  }

  return (
    <div>
      {!selfService && (
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(listRoute)} style={{ paddingInline: 0, marginBottom: 16 }}>
          Danh sách
        </Button>
      )}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: '0 0 4px' }}>
          {selfService ? 'Thông tin cá nhân' : isCreateMode ? `Thêm ${definition.singular}` : `Thông tin ${definition.singular}`}
        </Typography.Title>
        <Typography.Text type="secondary">
          {isCreateMode ? 'Mã được tạo tự động. Nhập thông tin còn lại.' : 'Chỉnh sửa thông tin và lưu thay đổi.'}
        </Typography.Text>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[20, 0]}>
            {visibleFields.map((field) => {
              const rules = field.required
                ? [{ required: true, whitespace: field.type !== 'number', message: `Vui lòng nhập ${field.label.toLocaleLowerCase('vi')}.` }]
                : [];
              if (field.type === 'subjects') {
                rules.splice(0, rules.length, { required: true, type: 'array', min: 1, message: 'Chọn ít nhất một môn giảng dạy.' });
              }
              if (field.type === 'year') {
                rules.push({ pattern: /^\d{4}$/, message: 'Năm phải gồm 4 chữ số.' });
              }
              if (field.type === 'phone') {
                rules.push({ pattern: /^[0-9+\s().-]{8,20}$/, message: 'Số điện thoại chưa hợp lệ.' });
              }
              if (field.type === 'email') {
                rules.push({ type: 'email', message: 'Email chưa hợp lệ.' });
              }
              if (field.name === 'id') {
                rules.push({
                  validator: (_, value) => {
                    const existing = getRecordById(type, value?.trim());
                    if (!existing || (!isCreateMode && value?.trim() === activeRecordId)) return Promise.resolve();
                    return Promise.reject(new Error(`${definition.idLabel} đã được sử dụng.`));
                  },
                });
              }

              return (
                <Col key={field.name} xs={24} md={field.wide ? 24 : 12}>
                  <Form.Item label={field.label} name={field.name} rules={rules}>
                    {field.type === 'schoolYear' ? (
                      <Select options={getSchoolYears().map((schoolYear) => ({ value: schoolYear, label: schoolYear }))} />
                    ) : field.type === 'select' ? (
                      <Select options={field.options.map((option) => ({ value: option, label: option }))} />
                    ) : field.type === 'subjects' ? (
                      <Select
                        mode="multiple"
                        options={getSubjects().map((subject) => ({ value: subject.id, label: subject.name }))}
                        placeholder="Chọn môn giảng dạy"
                        showSearch
                        optionFilterProp="label"
                        disabled={selfService}
                      />
                    ) : field.type === 'number' ? (
                      <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                    ) : (
                      <Input
                        type={field.type === 'email' ? 'email' : 'text'}
                        inputMode={field.type === 'phone' || field.type === 'year' ? 'numeric' : undefined}
                        maxLength={field.name === 'id' ? 30 : 160}
                        readOnly={selfService && field.name === 'id'
                          || (isCreateMode && field.readOnlyOnCreate)
                          || (type === 'classes' && field.name === 'schoolYear' && !isCreateMode)}
                      />
                    )}
                  </Form.Item>
                </Col>
              );
            })}
          </Row>
          <Space style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              {isCreateMode ? `Thêm ${definition.singular}` : 'Lưu thay đổi'}
            </Button>
            {!selfService && <Button onClick={() => navigate(listRoute)}>Hủy</Button>}
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default RecordForm;
