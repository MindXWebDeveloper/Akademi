import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Empty, Select, Table, Typography } from 'antd';
import { getRecords } from '../../data/schoolRecords';
import {
  getAnnualAverage,
  getGradeConfig,
  getGradeRecord,
  getSemesterAverage,
} from '../../data/grades';

const schoolYears = ['2025-2026', '2026-2027', '2027-2028'];

const formatScore = (score) => (
  score == null ? 'Chưa đủ điểm' : new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(score)
);

const StudentGradeSummary = ({ studentId }) => {
  const navigate = useNavigate();
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const subjects = [...new Set(getRecords('teachers').map((teacher) => teacher.subject).filter(Boolean))].sort();

  const rows = subjects.map((subject) => {
    const firstConfig = getGradeConfig(subject, schoolYear, '1');
    const secondConfig = getGradeConfig(subject, schoolYear, '2');
    const firstRecord = getGradeRecord(studentId, subject, schoolYear, '1');
    const secondRecord = getGradeRecord(studentId, subject, schoolYear, '2');
    const firstSemester = getSemesterAverage(firstRecord, firstConfig);
    const secondSemester = getSemesterAverage(secondRecord, secondConfig);

    return {
      key: subject,
      subject,
      firstSemester,
      secondSemester,
      annual: getAnnualAverage(firstSemester, secondSemester),
    };
  });

  const columns = [
    { title: 'Môn học', dataIndex: 'subject', key: 'subject' },
    { title: 'Học kỳ 1', dataIndex: 'firstSemester', key: 'firstSemester', render: formatScore },
    { title: 'Học kỳ 2', dataIndex: 'secondSemester', key: 'secondSemester', render: formatScore },
    { title: 'Cả năm', dataIndex: 'annual', key: 'annual', render: (score) => <Typography.Text strong>{formatScore(score)}</Typography.Text> },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, row) => (
        <Button type="link" onClick={() => navigate(`/students/${studentId}/report-card?subject=${encodeURIComponent(row.subject)}&year=${encodeURIComponent(schoolYear)}`)}>
          Chi tiết bảng điểm
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Tóm tắt điểm cả năm"
      extra={(
        <Select
          aria-label="Năm học tóm tắt điểm"
          value={schoolYear}
          onChange={setSchoolYear}
          options={schoolYears.map((year) => ({ value: year, label: year }))}
          style={{ width: 150 }}
        />
      )}
      style={{ marginTop: 24 }}
      styles={{ body: { padding: 0 } }}
    >
      {subjects.length ? (
        <Table rowKey="key" columns={columns} dataSource={rows} pagination={false} scroll={{ x: 700 }} />
      ) : (
        <Empty description="Chưa có môn học để tổng hợp điểm." style={{ padding: 24 }} />
      )}
    </Card>
  );
};

export default StudentGradeSummary;
