const validatePatient = (patientData, isUpdate = false) => {
    const errors = [];

    if (!isUpdate && !patientData.firstName) {
        errors.push('Name is required');
    }
    if (!isUpdate && !patientData.email) {
        errors.push('Email is required');
    }
    if (!isUpdate && !patientData.phone) {
        errors.push('Phone number is required');
    }
    if (!isUpdate && !patientData.dob) {
        errors.push('Date of birth is required');
    }

    // Add more validation rules as needed

    return errors;
};

module.exports = { validatePatient };