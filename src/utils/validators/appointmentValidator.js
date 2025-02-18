const validateAppointment = (appointmentData, isUpdate = false) => {
    const errors = [];

    // Skip required field validation for updates
    if (!isUpdate) {
        if (!appointmentData.userId) {
            errors.push('User ID is required');
        }
        if (!appointmentData.doctorId) {
            errors.push('Doctor ID is required');
        }
        if (!appointmentData.dateTime) {
            errors.push('Appointment date is required');
        }
    }

    // Validate appointment date if provided
    if (appointmentData.dateTime) {
        const date = new Date(appointmentData.dateTime);
        if (isNaN(date.getTime())) {
            errors.push('Invalid appointment date format');
        }
        // Check if date is in the future
        if (date < new Date()) {
            errors.push('Appointment date must be in the future');
        }
    }

    // Validate status if provided
    if (appointmentData.status &&
        !['scheduled', 'completed', 'canceled'].includes(appointmentData.status)) {
        errors.push('Invalid appointment status');
    }

    return errors;
};

module.exports = { validateAppointment };