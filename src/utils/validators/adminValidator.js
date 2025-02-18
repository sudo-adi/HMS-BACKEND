const validateAdmin = (adminData, isUpdate = false) => {
  const errors = [];

  if (!isUpdate && !adminData.firstName) {
      errors.push('Name is required');
  }
  if (!isUpdate && !adminData.email) {
      errors.push('Email is required');
  }
  if (!isUpdate && !adminData.phone) {
      errors.push('Phone number is required');
  }
  if (!isUpdate && !adminData.role) {
      errors.push('Role is required');
  }

  // Add more validation rules as needed

  return errors;
};

module.exports = { validateAdmin };