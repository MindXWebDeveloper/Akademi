import RecordForm from '../../SchoolRecords/RecordForm';

const TeacherDetail = ({ isCreateMode = false, selfService = false, profileId }) => (
  <RecordForm
    type="teachers"
    isCreateMode={isCreateMode}
    selfService={selfService}
    profileId={profileId}
  />
);

export default TeacherDetail;
