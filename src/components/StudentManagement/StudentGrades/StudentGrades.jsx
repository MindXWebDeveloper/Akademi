import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Empty,
  InputNumber,
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
  completeGroupAverage,
  getGradeConfig,
  getGradeRecord,
  gradeWeights,
  saveGradeConfig,
  saveGradeRecord,
} from '../../../data/grades';

const assessmentGroups = [
  { key: 'oralScores', label: 'Kiểm tra miệng', countKey: 'oralCount' },
  { key: 'shortTestScores', label: 'Kiểm tra 15 phút', countKey: 'shortTestCount' },
  { key: 'onePeriodScores', label: 'Kiểm tra 1 tiết', countKey: 'onePeriodCount' },
];

const fixedAssessments = [
  { key: 'midtermScore', label: 'Giữa kỳ' },
  { key: 'finalScore', label: 'Cuối kỳ' },
];

const examConfigRows = [
  ...assessmentGroups.map((group) => ({ ...group, count: true, weight: gradeWeights[group.key] })),
  ...fixedAssessments.map((assessment) => ({
    ...assessment,
    count: false,
    fixedCount: 1,
    weight: gradeWeights[assessment.key],
  })),
];

const formatScore = (score) => (
  score == null ? 'Chưa có điểm' : new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(score)
);

const resizeScores = (scores, count) => (
  Array.from({ length: count }, (_, index) => scores[index] ?? null)
);

const StudentGrades = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const student = getStudents().find((item) => item.id === studentId);
  const subjects = [...new Set(getRecords('teachers').map((teacher) => teacher.subject).filter(Boolean))].sort();
  const [subject, setSubject] = useState(subjects[0] ?? '');
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [semester, setSemester] = useState('1');
  const [config, setConfig] = useState(() => getGradeConfig(subjects[0] ?? '', '2026-2027', '1'));
  const [record, setRecord] = useState(() => getGradeRecord(studentId, subjects[0] ?? '', '2026-2027', '1'));

  useEffect(() => {
    if (!subject) return;
    const nextConfig = getGradeConfig(subject, schoolYear, semester);
    const nextRecord = getGradeRecord(studentId, subject, schoolYear, semester);
    setConfig(nextConfig);
    setRecord({
      ...nextRecord,
      oralScores: resizeScores(nextRecord.oralScores, nextConfig.oralCount),
      shortTestScores: resizeScores(nextRecord.shortTestScores, nextConfig.shortTestCount),
      onePeriodScores: resizeScores(nextRecord.onePeriodScores, nextConfig.onePeriodCount),
    });
  }, [schoolYear, semester, studentId, subject]);

  const updateCount = (countKey, scoreKey, value) => {
    const count = Math.max(0, Math.min(20, Number(value) || 0));
    setConfig((current) => ({ ...current, [countKey]: count }));
    setRecord((current) => ({ ...current, [scoreKey]: resizeScores(current[scoreKey], count) }));
  };

  const updateScore = (key, index, value) => {
    setRecord((current) => ({
      ...current,
      [key]: current[key].map((score, scoreIndex) => (scoreIndex === index ? value : score)),
    }));
  };

  const save = () => {
    const configSaved = saveGradeConfig(subject, schoolYear, semester, config);
    const recordSaved = saveGradeRecord(studentId, subject, schoolYear, semester, record);

    if (!configSaved || !recordSaved) {
      message.error('Không thể lưu điểm. Kiểm tra dung lượng lưu trữ của trình duyệt.');
      return;
    }

    message.success('Đã lưu cấu hình và điểm số.');
  };

  const numberOfTestColumns = Math.max(
    config.oralCount,
    config.shortTestCount,
    config.onePeriodCount,
  );

  const columns = [
    { title: 'Loại điểm', dataIndex: 'label', key: 'label', fixed: 'left', width: 180 },
    ...Array.from({ length: numberOfTestColumns }, (_, index) => ({
      title: `Bài ${index + 1}`,
      key: `test-${index}`,
      width: 130,
      render: (_, row) => {
        if (row.scoreKey) {
          if (index >= config[row.countKey]) return null;
          return (
            <InputNumber
              min={0}
              max={10}
              step={0.01}
              precision={2}
              value={record[row.scoreKey][index]}
              onChange={(value) => updateScore(row.scoreKey, index, value)}
              aria-label={`${row.label}, bài ${index + 1}`}
              style={{ width: 96 }}
            />
          );
        }

        return index === 0 ? (
          <InputNumber
            min={0}
            max={10}
            step={0.01}
            precision={2}
            value={record[row.key]}
            onChange={(value) => setRecord((current) => ({ ...current, [row.key]: value }))}
            aria-label={`Điểm ${row.label.toLocaleLowerCase('vi')}`}
            style={{ width: 96 }}
          />
        ) : null;
      },
    })),
    {
      title: 'Điểm trung bình',
      key: 'average',
      width: 150,
      render: (_, row) => {
        const average = row.scoreKey
          ? completeGroupAverage(record[row.scoreKey], config[row.countKey])
          : record[row.key];
        return <Typography.Text strong>{formatScore(average)}</Typography.Text>;
      },
    },
  ];

  const tableData = [
    ...assessmentGroups.map((group) => ({
      key: group.key,
      label: group.label,
      scoreKey: group.key,
      countKey: group.countKey,
    })),
    ...fixedAssessments.map((assessment) => ({
      key: assessment.key,
      label: assessment.label,
    })),
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
        onClick={() => navigate('/students')}
        style={{ paddingInline: 0, marginBottom: 16 }}
      >
        Danh sách học sinh
      </Button>

      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: '0 0 4px' }}>Nhập điểm học sinh</Typography.Title>
        <Typography.Text type="secondary">
          {student.name} · {student.id} · Lớp {student.className}
        </Typography.Text>
      </div>

      <Card title="Môn học và kỳ học" style={{ marginBottom: 24 }}>
        <Space wrap size="large" align="end">
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Môn học</Typography.Text>
            <Select
              value={subject || undefined}
              onChange={setSubject}
              options={subjects.map((item) => ({ value: item, label: item }))}
              placeholder="Chọn môn học"
              style={{ width: 220 }}
            />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Năm học</Typography.Text>
            <Select
              value={schoolYear}
              onChange={setSchoolYear}
              options={['2025-2026', '2026-2027', '2027-2028'].map((item) => ({ value: item, label: item }))}
              style={{ width: 180 }}
            />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Học kỳ</Typography.Text>
            <Select
              value={semester}
              onChange={setSemester}
              options={[{ value: '1', label: 'Học kỳ 1' }, { value: '2', label: 'Học kỳ 2' }]}
              style={{ width: 150 }}
            />
          </div>
        </Space>
      </Card>

      {!subjects.length ? (
        <Card><Empty description="Chưa có môn học. Hãy thêm môn giảng dạy trong hồ sơ giáo viên trước." /></Card>
      ) : (
        <>
          <Card title="Cấu hình bài kiểm tra và hệ số" style={{ marginBottom: 24 }} styles={{ body: { padding: 0 } }}>
            <Table
              rowKey="key"
              pagination={false}
              dataSource={examConfigRows}
              columns={[
                { title: 'Loại kiểm tra', dataIndex: 'label', key: 'label' },
                {
                  title: 'Số bài',
                  key: 'count',
                  width: 180,
                  render: (_, row) => row.count ? (
                    <Space size={8}>
                      <InputNumber
                        min={0}
                        max={20}
                        value={config[row.countKey]}
                        onChange={(value) => updateCount(row.countKey, row.key, value)}
                      />
                      <Typography.Text type="secondary">bài</Typography.Text>
                    </Space>
                  ) : `${row.fixedCount} bài`,
                },
                { title: 'Hệ số', dataIndex: 'weight', key: 'weight', width: 120 },
              ]}
              scroll={{ x: 500 }}
            />
          </Card>

          <Card
            title="Bảng điểm"
            extra={(
              <Button type="primary" icon={<SaveOutlined />} onClick={save}>
                Lưu điểm
              </Button>
            )}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              rowKey="key"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
            Điểm trung bình từng loại được tính từ các bài đã nhập và làm tròn đến 2 chữ số thập phân.
          </Typography.Text>
        </>
      )}
    </div>
  );
};

export default StudentGrades;
