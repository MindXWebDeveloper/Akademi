import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { getSubjects } from '../../../data/subjects';
import { getCurrentSchoolYear, getSchoolYears } from '../../../data/schoolYears';
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
  const location = useLocation();
  const requestedReturnTo = location.state?.returnTo;
  const returnTo = typeof requestedReturnTo === 'string'
    && (requestedReturnTo === '/students' || requestedReturnTo.startsWith('/students?'))
    ? requestedReturnTo
    : '/students';
  const goToList = () => navigate(returnTo, { replace: true });
  const subjects = getSubjects().map((subject) => subject.name).sort((left, right) => left.localeCompare(right, 'vi'));
  const schoolYears = getSchoolYears();
  const currentSchoolYear = getCurrentSchoolYear();
  const [subject, setSubject] = useState(subjects[0] ?? '');
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear);
  const [semester, setSemester] = useState('1');
  const student = getStudents(schoolYear).find((item) => item.id === studentId);
  const [gradeDrafts, setGradeDrafts] = useState({});
  const selectionKey = [studentId, subject, schoolYear, semester].join('|');
  const baseConfig = getGradeConfig(subject, schoolYear, semester);
  const baseRecord = getGradeRecord(studentId, subject, schoolYear, semester);
  const config = gradeDrafts[selectionKey]?.config ?? baseConfig;
  const record = gradeDrafts[selectionKey]?.record ?? {
    ...baseRecord,
    oralScores: resizeScores(baseRecord.oralScores, baseConfig.oralCount),
    shortTestScores: resizeScores(baseRecord.shortTestScores, baseConfig.shortTestCount),
    onePeriodScores: resizeScores(baseRecord.onePeriodScores, baseConfig.onePeriodCount),
  };

  const updateCount = (countKey, scoreKey, value) => {
    const count = Math.max(0, Math.min(20, Number(value) || 0));
    setGradeDrafts((current) => {
      const currentDraft = current[selectionKey] ?? { config, record };
      return {
        ...current,
        [selectionKey]: {
          config: { ...currentDraft.config, [countKey]: count },
          record: { ...currentDraft.record, [scoreKey]: resizeScores(currentDraft.record[scoreKey], count) },
        },
      };
    });
  };

  const updateScore = (key, index, value) => {
    setGradeDrafts((current) => {
      const currentDraft = current[selectionKey] ?? { config, record };
      return {
        ...current,
        [selectionKey]: {
          ...currentDraft,
          record: {
            ...currentDraft.record,
            [key]: currentDraft.record[key].map((score, scoreIndex) => (scoreIndex === index ? value : score)),
          },
        },
      };
    });
  };

  const save = async () => {
    const configResult = await saveGradeConfig(subject, schoolYear, semester, config);
    if (!configResult.saved) {
      message.error(`Không thể lưu cấu hình điểm.${configResult.error ? ` ${configResult.error.message}` : ''}`);
      return;
    }
    const recordResult = await saveGradeRecord(studentId, subject, schoolYear, semester, record);

    if (!recordResult.saved) {
      message.error(`Cấu hình đã lưu nhưng điểm số chưa lưu.${recordResult.error ? ` ${recordResult.error.message}` : ''}`);
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
            onChange={(value) => setGradeDrafts((current) => {
              const currentDraft = current[selectionKey] ?? { config, record };
              return {
                ...current,
                [selectionKey]: {
                  ...currentDraft,
                  record: { ...currentDraft.record, [row.key]: value },
                },
              };
            })}
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
          action={<Button onClick={goToList}>Về danh sách</Button>}
        />
      </Card>
    );
  }

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={goToList}
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
              options={schoolYears.map((item) => ({ value: item, label: item }))}
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
