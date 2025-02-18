const validateUser = (userData, isUpdate = false) => {
    const errors = [];

    // Skip required field validation for updates
    if (!isUpdate) {
        if (!userData.email) {
            errors.push('Email is required');
        }
        if (!userData.phone) {
            errors.push('Phone number is required');
        }
        if (!userData.firstName) {
            errors.push('Name is required');
        }
    }

    // Validate email format if provided
    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        errors.push('Invalid email format');
    }

    // Validate phone format if provided (basic validation)
    if (userData.phone && !/^\+?[1-9]\d{9,14}$/.test(userData.phone)) {
        errors.push('Invalid phone number format');
    }

    // Validate date of birth if provided
    if (userData.dob) {
        const date = new Date(userData.dob);
        if (isNaN(date.getTime())) {
            errors.push('Invalid date of birth format');
        }
    }

    return errors;
};

module.exports = { validateUser };