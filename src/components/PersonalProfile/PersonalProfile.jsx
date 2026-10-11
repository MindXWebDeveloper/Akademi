import { Alert, Card } from 'antd';
import StudentDetail from '../StudentManagement/StudentDetail/StudentDetail';
import TeacherDetail from '../TeacherManagement/TeacherDetail/TeacherDetail';

const PersonalProfile = ({ user }) => {
  if (user?.role === 'student' && user.studentKey) {
    return <StudentDetail selfService profileId={user.studentKey} />;
  }

  if ((user?.role === 'teacher' || user?.role === 'principal') && user.teacherKey) {
    return <TeacherDetail selfService profileId={user.teacherKey} />;
  }

  return (
    <Card>
      <Alert
        type="warning"
        showIcon
        message="Không tìm thấy hồ sơ cá nhân"
        description="Tài khoản hiện tại chưa được liên kết với hồ sơ học sinh hoặc giáo viên."
      />
    </Card>
  );
};

export default PersonalProfile;
