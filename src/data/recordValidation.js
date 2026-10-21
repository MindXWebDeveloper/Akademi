const comparableValue = (value) => String(value ?? '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('vi');

export const hasDuplicatePersonProfile = (records, candidate, excludedId) => {
  const fields = ['name', 'birthYear', 'gender', 'address'];
  const candidateValues = fields.map((field) => comparableValue(candidate[field]));
  if (candidateValues.some((value) => !value)) return false;

  return records.some((record) => (
    String(record.id) !== String(excludedId ?? '')
    && fields.every((field, index) => comparableValue(record[field]) === candidateValues[index])
  ));
};

export const normalizeRecordName = (name) => comparableValue(name);
