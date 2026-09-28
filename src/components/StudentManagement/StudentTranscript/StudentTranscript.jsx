import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { getStudents } from '../../../data/students';
import { getRecords } from '../../../data/schoolRecords';
import {
  getAnnualAverage,
  getGradeConfig,
  getGradeRecord,
  getSemesterAverage,
  getStudentTranscript,
  saveStudentTranscript,
} from '../../../data/grades';

const { TextArea } = Input;
const schoolYears = ['2025-2026', '2026-2027', '2027-2028'];
const academicLevels = ['Tốt', 'Khá', 'Đạt', 'Chưa đạt'];
const conductLevels = ['Tốt', 'Khá', 'Đạt', 'Chưa đạt'];

const formatScore = (score) => (
  score == null ? 'Chưa đủ điểm' : new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(score)
);

const StudentTranscript = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const student = getStudents().find((item) => item.id === studentId);
  const subjects = [...new Set(getRecords('teachers').map((teacher) => teacher.subject).filter(Boolean))].sort();
  const [schoolYear, setSchoolYear] = useState(() => {
    const requestedYear = searchParams.get('year');
    return schoolYears.includes(requestedYear) ? requestedYear : '2026-2027';
  });
  const [transcript, setTranscript] = useState(() => getStudentTranscript(studentId, schoolYear));

  useEffect(() => {
    setTranscript(getStudentTranscript(studentId, schoolYear));
  }, [schoolYear, studentId]);

  const subjectRows = subjects.map((subject) => {
    const firstSemester = getSemesterAverage(
      getGradeRecord(studentId, subject, schoolYear, '1'),
      getGradeConfig(subject, schoolYear, '1'),
    );
    const secondSemester = getSemesterAverage(
      getGradeRecord(studentId, subject, schoolYear, '2'),
      getGradeConfig(subject, schoolYear, '2'),
    );

    return {
      key: subject,
      subject,
      firstSemester,
      secondSemester,
      annual: getAnnualAverage(firstSemester, secondSemester),
    };
  });

  const getOverallAverage = (field) => {
    if (!subjectRows.length || subjectRows.some((row) => row[field] == null)) return null;
    const total = subjectRows.reduce((sum, row) => sum + row[field], 0);
    return Math.round((total / subjectRows.length + Number.EPSILON) * 100) / 100;
  };

  const firstSemesterAverage = getOverallAverage('firstSemester');
  const secondSemesterAverage = getOverallAverage('secondSemester');
  const annualAverage = getOverallAverage('annual');

  const handleYearChange = (value) => {
    setSchoolYear(value);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('year', value);
    setSearchParams(nextParams, { replace: true });
  };

  const updateTranscript = (field, value) => {
    setTranscript((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    if (!saveStudentTranscript(studentId, schoolYear, transcript)) {
      message.error('Không thể lưu thông tin học bạ vào trình duyệt.');
      return;
    }
    message.success('Đã lưu học lực, hạnh kiểm và nhận xét.');
  };

  const columns = [
    { title: 'Môn học', dataIndex: 'subject', key: 'subject' },
    { title: 'Điểm TB HK1', dataIndex: 'firstSemester', key: 'firstSemester', render: formatScore },
    { title: 'Điểm TB HK2', dataIndex: 'secondSemester', key: 'secondSemester', render: formatScore },
    { title: 'Điểm TB cả năm', dataIndex: 'annual', key: 'annual', render: (score) => <Typography.Text strong>{formatScore(score)}</Typography.Text> },
  ];

  if (!student) {
    return (
      <Card>
        <Alert
          type="warning"
          showIcon
          message="Không tìm thấy học sinh"
          description={`Mã học sinh ${studentId} không tồn tại trong danh sách.`}
          action={<Button onClick={() => navigate('/students')}>Về danh sách</Button>}
        />
      </Card>
    );
  }

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/students/${studentId}`)}
        style={{ paddingInline: 0, marginBottom: 16 }}
      >
        Hồ sơ học sinh
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>Học bạ học sinh</Typography.Title>
          <Typography.Text type="secondary">{student.name} · {student.id} · Lớp {student.className}</Typography.Text>
        </div>
        <Select
          aria-label="Năm học học bạ"
          value={schoolYear}
          onChange={handleYearChange}
          options={schoolYears.map((year) => ({ value: year, label: year }))}
          style={{ width: 160 }}
        />
      </div>

      <Card title="Thông tin học sinh" style={{ marginBottom: 24 }}>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="Mã học sinh">{student.id}</Descriptions.Item>
          <Descriptions.Item label="Họ và tên">{student.name}</Descriptions.Item>
          <Descriptions.Item label="Năm sinh">{student.birthYear || '—'}</Descriptions.Item>
          <Descriptions.Item label="Giới tính">{student.gender || '—'}</Descriptions.Item>
          <Descriptions.Item label="Dân tộc">{student.ethnicity || '—'}</Descriptions.Item>
          <Descriptions.Item label="Lớp">{student.className || '—'}</Descriptions.Item>
          <Descriptions.Item label="Quê quán">{student.hometown || '—'}</Descriptions.Item>
          <Descriptions.Item label="Nơi cư trú">{student.address || '—'}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{student.phone || '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{student.email || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`Kết quả học tập · ${schoolYear}`} style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, background: '#f5f7fa', borderRadius: 6 }}>
              <Typography.Text type="secondary">Điểm trung bình HK1</Typography.Text>
              <Typography.Title level={4} style={{ margin: '8px 0 0' }}>{formatScore(firstSemesterAverage)}</Typography.Title>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, background: '#f5f7fa', borderRadius: 6 }}>
              <Typography.Text type="secondary">Điểm trung bình HK2</Typography.Text>
              <Typography.Title level={4} style={{ margin: '8px 0 0' }}>{formatScore(secondSemesterAverage)}</Typography.Title>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, background: '#f5f7fa', borderRadius: 6 }}>
              <Typography.Text type="secondary">Điểm trung bình cả năm</Typography.Text>
              <Typography.Title level={4} style={{ margin: '8px 0 0' }}>{formatScore(annualAverage)}</Typography.Title>
            </div>
          </Col>
        </Row>
        <div style={{ marginTop: 20 }}>
          {subjectRows.length ? (
            <Table rowKey="key" columns={columns} dataSource={subjectRows} pagination={false} scroll={{ x: 650 }} />
          ) : (
            <Empty description="Chưa có môn học để tổng hợp điểm." />
          )}
        </div>
      </Card>

      <Card
        title="Đánh giá cuối năm"
        extra={<Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>Lưu đánh giá</Button>}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[20, 0]}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 20 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Học lực</Typography.Text>
              <Select
                value={transcript.academicLevel || undefined}
                onChange={(value) => updateTranscript('academicLevel', value)}
                options={academicLevels.map((level) => ({ value: level, label: level }))}
                placeholder="Chọn xếp loại học lực"
                style={{ width: '100%' }}
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 20 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Hạnh kiểm</Typography.Text>
              <Select
                value={transcript.conduct || undefined}
                onChange={(value) => updateTranscript('conduct', value)}
                options={conductLevels.map((level) => ({ value: level, label: level }))}
                placeholder="Chọn xếp loại hạnh kiểm"
                style={{ width: '100%' }}
              />
            </div>
          </Col>
          <Col xs={24}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Nhận xét của giáo viên chủ nhiệm</Typography.Text>
            <TextArea
              value={transcript.homeroomComment}
              onChange={(event) => updateTranscript('homeroomComment', event.target.value)}
              maxLength={1000}
              showCount
              rows={4}
              placeholder="Nhập nhận xét cuối năm học"
            />
          </Col>
        </Row>
      </Card>
      <Typography.Text type="secondary">
        Điểm trung bình chung mỗi kỳ chỉ hiển thị khi tất cả môn học có đủ điểm; điểm cả năm tính theo (HK1 + 2 × HK2) / 3.
      </Typography.Text>
    </div>
  );
};

export default StudentTranscript;
