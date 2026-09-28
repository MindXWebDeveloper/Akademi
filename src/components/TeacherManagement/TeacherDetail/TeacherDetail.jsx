import RecordForm from '../../SchoolRecords/RecordForm';

const TeacherDetail = ({ isCreateMode = false }) => (
  <RecordForm type="teachers" isCreateMode={isCreateMode} />
);

export default TeacherDetail;
