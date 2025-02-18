const validateDoctor = (doctorData, isUpdate = false) => {
  const errors = [];

  if (!isUpdate && !doctorData.firstName) {
      errors.push('Name is required');
  }
  if (!isUpdate && !doctorData.email) {
      errors.push('Email is required');
  }
  if (!isUpdate && !doctorData.phone) {
      errors.push('Phone number is required');
  }
  if (!isUpdate && !doctorData.specialization) {
      errors.push('Specialization is required');
  }

  // Add more validation rules as needed

  return errors;
};

module.exports = { validateDoctor };