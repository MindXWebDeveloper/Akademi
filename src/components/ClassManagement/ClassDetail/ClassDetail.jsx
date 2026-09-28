import RecordForm from '../../SchoolRecords/RecordForm';

const ClassDetail = ({ isCreateMode = false }) => (
  <RecordForm type="classes" isCreateMode={isCreateMode} />
);

export default ClassDetail;
