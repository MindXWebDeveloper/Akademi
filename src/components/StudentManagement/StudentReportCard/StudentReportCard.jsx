import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Empty,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getStudents } from '../../../data/students';
import { getRecords } from '../../../data/schoolRecords';
import {
  completeGroupAverage,
  getAnnualAverage,
  getGradeConfig,
  getGradeRecord,
  getSemesterAverage,
  gradeWeights,
} from '../../../data/grades';

const scoreGroups = [
  { key: 'oralScores', label: 'Kiểm tra miệng', countKey: 'oralCount' },
  { key: 'shortTestScores', label: 'Kiểm tra 15 phút', countKey: 'shortTestCount' },
  { key: 'onePeriodScores', label: 'Kiểm tra 1 tiết', countKey: 'onePeriodCount' },
];

const fixedScores = [
  { key: 'midtermScore', label: 'Giữa kỳ' },
  { key: 'finalScore', label: 'Cuối kỳ' },
];

const schoolYears = ['2025-2026', '2026-2027', '2027-2028'];

const formatScore = (score) => (
  score == null ? 'Chưa đủ điểm' : new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(score)
);

const getSemesterData = (studentId, subject, schoolYear, semester) => {
  const config = getGradeConfig(subject, schoolYear, semester);
  const record = getGradeRecord(studentId, subject, schoolYear, semester);
  const detailRows = [
    ...scoreGroups.map((group) => {
      const count = config[group.countKey];
      const scores = record[group.key]?.slice(0, count) ?? [];
      return {
        key: `${semester}-${group.key}`,
        label: group.label,
        coefficient: gradeWeights[group.key],
        scores,
        average: completeGroupAverage(scores, count),
      };
    }),
    ...fixedScores.map((score) => ({
      key: `${semester}-${score.key}`,
      label: score.label,
      coefficient: gradeWeights[score.key],
      scores: record[score.key] == null ? [] : [record[score.key]],
      average: record[score.key],
    })),
  ];

  return {
    config,
    record,
    detailRows,
    average: getSemesterAverage(record, config),
  };
};

const StudentReportCard = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const student = getStudents().find((item) => item.id === studentId);
  const subjects = [...new Set(getRecords('teachers').map((teacher) => teacher.subject).filter(Boolean))].sort();
  const [subject, setSubject] = useState(() => {
    const requestedSubject = searchParams.get('subject');
    return subjects.includes(requestedSubject) ? requestedSubject : subjects[0] ?? '';
  });
  const [schoolYear, setSchoolYear] = useState(() => {
    const requestedYear = searchParams.get('year');
    return schoolYears.includes(requestedYear) ? requestedYear : '2026-2027';
  });

  const firstSemester = subject ? getSemesterData(studentId, subject, schoolYear, '1') : null;
  const secondSemester = subject ? getSemesterData(studentId, subject, schoolYear, '2') : null;
  const annualAverage = firstSemester && secondSemester
    ? getAnnualAverage(firstSemester.average, secondSemester.average)
    : null;
  const maxTestCount = Math.max(
    firstSemester?.config.oralCount ?? 0,
    firstSemester?.config.shortTestCount ?? 0,
    firstSemester?.config.onePeriodCount ?? 0,
    secondSemester?.config.oralCount ?? 0,
    secondSemester?.config.shortTestCount ?? 0,
    secondSemester?.config.onePeriodCount ?? 0,
    1,
  );

  const detailColumns = useMemo(() => [
    { title: 'Loại điểm', dataIndex: 'label', key: 'label', fixed: 'left', width: 180 },
    { title: 'Hệ số', dataIndex: 'coefficient', key: 'coefficient', width: 90 },
    ...Array.from({ length: maxTestCount }, (_, index) => ({
      title: `Bài ${index + 1}`,
      key: `score-${index}`,
      width: 120,
      render: (_, row) => index < row.scores.length
        ? row.scores[index] == null
          ? <Typography.Text type="secondary">Chưa nhập</Typography.Text>
          : formatScore(Number(row.scores[index]))
        : null,
    })),
    {
      title: 'Điểm TB loại',
      dataIndex: 'average',
      key: 'average',
      width: 140,
      render: formatScore,
    },
  ], [maxTestCount]);

  const summaryColumns = [
    { title: 'Học kỳ 1', dataIndex: 'firstSemester', key: 'firstSemester', render: formatScore },
    { title: 'Học kỳ 2', dataIndex: 'secondSemester', key: 'secondSemester', render: formatScore },
    { title: 'Cả năm', dataIndex: 'annual', key: 'annual', render: (score) => <Typography.Text strong>{formatScore(score)}</Typography.Text> },
  ];

  const summaryRows = subject ? [{
    key: subject,
    firstSemester: firstSemester.average,
    secondSemester: secondSemester.average,
    annual: annualAverage,
  }] : [];

  const handleSubjectChange = (value) => {
    setSubject(value);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('subject', value);
    setSearchParams(nextParams, { replace: true });
  };

  const handleYearChange = (value) => {
    setSchoolYear(value);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('year', value);
    setSearchParams(nextParams, { replace: true });
  };

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

      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: '0 0 4px' }}>Chi tiết bảng điểm</Typography.Title>
        <Typography.Text type="secondary">
          {student.name} · {student.id} · Lớp {student.className}
        </Typography.Text>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="large" align="end">
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Môn học</Typography.Text>
            <Select
              value={subject || undefined}
              onChange={handleSubjectChange}
              options={subjects.map((item) => ({ value: item, label: item }))}
              placeholder="Chọn môn học"
              style={{ width: 220 }}
            />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Năm học</Typography.Text>
            <Select
              value={schoolYear}
              onChange={handleYearChange}
              options={schoolYears.map((year) => ({ value: year, label: year }))}
              style={{ width: 180 }}
            />
          </div>
          <Typography.Text type="secondary">
            Điểm cả năm = (HK1 × 1 + HK2 × 2) / 3
          </Typography.Text>
        </Space>
      </Card>

      {!subjects.length ? (
        <Card><Empty description="Chưa có môn học để hiển thị bảng điểm." /></Card>
      ) : (
        <>
          <Card title={`Tổng hợp · ${subject} · ${schoolYear}`} style={{ marginBottom: 24 }} styles={{ body: { padding: 0 } }}>
            <Table rowKey="key" columns={summaryColumns} dataSource={summaryRows} pagination={false} />
          </Card>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {[{ label: 'Học kỳ 1', data: firstSemester }, { label: 'Học kỳ 2', data: secondSemester }].map(({ label, data }) => (
              <Card
                key={label}
                title={label}
                extra={<Typography.Text strong>Điểm trung bình: {formatScore(data.average)}</Typography.Text>}
                styles={{ body: { padding: 0 } }}
              >
                <Table
                  rowKey="key"
                  columns={detailColumns}
                  dataSource={data.detailRows}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            ))}
          </Space>
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
            Điểm trung bình học kỳ chỉ được tính khi đã nhập đủ các bài kiểm tra theo cấu hình. Điểm trung bình năm chỉ có khi cả hai học kỳ đã đủ điểm.
          </Typography.Text>
        </>
      )}
    </div>
  );
};

export default StudentReportCard;
