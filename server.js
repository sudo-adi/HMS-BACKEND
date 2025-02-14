const express = require('express');
const { FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 8383;
const cors = require("cors");
const { db } = require('./firebase.js');

app.use(express.json());
app.use(cors());

// Validation functions
const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

const validatePhone = (phone) => {
    return /^\+?[1-9]\d{1,14}$/.test(phone);
};

const validateUser = (user, isUpdate = false) => {
    const errors = [];

    // Required fields validation
    if (!isUpdate) {
        const requiredFields = ['firstName', 'lastName', 'email', 'password', 'role', 'phone', 'dob'];

        // Additional required fields for doctors
        if (user.role === 'doctor') {
            requiredFields.push('specialization', 'department', 'experience', 'education', 'startAt', 'endAt', 'sessionDuration');
        }

        requiredFields.forEach(field => {
            if (!user[field]) errors.push(`${field} is required`);
        });

        // Password length validation
        if (user.password && user.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        // DOB validation
        if (user.dob) {
            const dobDate = new Date(user.dob);
            if (isNaN(dobDate.getTime())) {
                errors.push('Invalid date of birth format (YYYY-MM-DD)');
            }
        }
    }

    // Email validation
    if (user.email && !validateEmail(user.email)) {
        errors.push('Invalid email format');
    }

    // Phone validation
    if (user.phone && !validatePhone(user.phone)) {
        errors.push('Invalid phone number format (E.164)');
    }

    // Role validation
    if (user.role && !['patient', 'doctor', 'admin'].includes(user.role)) {
        errors.push('Invalid role');
    }

    // Department validation
    if (user.department && !['cardiology', 'radiology', 'general', 'billing', 'pharmacy'].includes(user.department)) {
        errors.push('Invalid department');
    }

    // Gender validation
    if (user.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(user.gender)) {
        errors.push('Invalid gender');
    }

    // Doctor-specific validations
    if (user.role === 'doctor') {
        // Experience validation
        if (user.experience && typeof user.experience !== 'number') {
            errors.push('Experience must be a number');
        }

        // Education validation
        if (user.education && !Array.isArray(user.education)) {
            errors.push('Education must be an array');
        }

        // Specialization validation
        if (user.specialization && typeof user.specialization !== 'string') {
            errors.push('Specialization must be a string');
        }

        // Session Duration validation
        if (user.sessionDuration) {
            if (typeof user.sessionDuration !== 'number' || user.sessionDuration <= 0) {
                errors.push('Session duration must be a positive number in minutes');
            }
        }

        // Shift timing validations
        if (user.startAt || user.endAt) {
            const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;

            if (!timeFormat.test(user.startAt)) {
                errors.push('Invalid startAt time format. Use 24-hour format (HH:mm)');
            }
            if (!timeFormat.test(user.endAt)) {
                errors.push('Invalid endAt time format. Use 24-hour format (HH:mm)');
            }

            if (timeFormat.test(user.startAt) && timeFormat.test(user.endAt)) {
                const [startHour, startMinute] = user.startAt.split(':').map(Number);
                const [endHour, endMinute] = user.endAt.split(':').map(Number);

                const startTime = startHour * 60 + startMinute;
                const endTime = endHour * 60 + endMinute;

                if (startTime >= endTime) {
                    errors.push('End time must be after start time');
                }
            }
        }
    }

    return errors;
};

// Single reference to HMS collection and users document
const getUsersRef = () => db.collection('HMS').doc('users');

// Get all users
app.get('/users', async (req, res) => {
    try {
        const doc = await getUsersRef().get();
        if (!doc.exists) {
            return res.status(404).send('No users found');
        }
        res.status(200).send(doc.data());
    } catch (error) {
        res.status(500).send('Error fetching users: ' + error.message);
    }
});

// Get user by ID
app.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await getUsersRef().get();
        if (!doc.exists || !doc.data()[id]) {
            return res.status(404).send('User not found');
        }
        res.status(200).send({ [id]: doc.data()[id] });
    } catch (error) {
        res.status(500).send('Error fetching user: ' + error.message);
    }
});

// Create new user
app.post('/users', async (req, res) => {
    try {
        const userData = req.body;

        // Validate user data
        const validationErrors = validateUser(userData);
        if (validationErrors.length > 0) {
            return res.status(400).send({ errors: validationErrors });
        }

        // Check for existing email or phone
        const doc = await getUsersRef().get();
        const users = doc.data() || {};

        const emailExists = Object.values(users).some(user => user.email === userData.email);
        if (emailExists) {
            return res.status(400).send({ error: 'Email already exists' });
        }

        const phoneExists = Object.values(users).some(user => user.phone === userData.phone);
        if (phoneExists) {
            return res.status(400).send({ error: 'Phone number already exists' });
        }

        // Add timestamps
        const now = new Date().toISOString();
        userData.createdAt = now;
        userData.updatedAt = now;

        // Convert DOB to ISO string if present
        if (userData.dob) {
            userData.dob = new Date(userData.dob).toISOString();
        }

        // Generate a unique ID using UUID v4
        const userId = uuidv4();

        await getUsersRef().set({
            [userId]: userData
        }, { merge: true });

        const updatedDoc = await getUsersRef().get();
        res.status(201).send({ [userId]: updatedDoc.data()[userId] });
    } catch (error) {
        res.status(500).send('Error creating user: ' + error.message);
    }
});

// Update user
app.patch('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate update data
        const validationErrors = validateUser(updateData, true);
        if (validationErrors.length > 0) {
            return res.status(400).send({ errors: validationErrors });
        }

        // Update timestamp
        updateData.updatedAt = new Date().toISOString();

        // Convert DOB to ISO string if present
        if (updateData.dob) {
            updateData.dob = new Date(updateData.dob).toISOString();
        }

        const doc = await getUsersRef().get();
        if (!doc.exists || !doc.data()[id]) {
            return res.status(404).send('User not found');
        }

        await getUsersRef().set({
            [id]: { ...doc.data()[id], ...updateData }
        }, { merge: true });

        const updatedDoc = await getUsersRef().get();
        res.status(200).send({ [id]: updatedDoc.data()[id] });
    } catch (error) {
        res.status(500).send('Error updating user: ' + error.message);
    }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await getUsersRef().get();

        if (!doc.exists || !doc.data()[id]) {
            return res.status(404).send('User not found');
        }

        await getUsersRef().update({
            [id]: FieldValue.delete()
        });

        res.status(200).send({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).send('Error deleting user: ' + error.message);
    }
});

// Appointment validation function
const validateAppointment = (appointment, isUpdate = false) => {
    const errors = [];

    // Required fields validation for new appointments
    if (!isUpdate) {
        const requiredFields = ['userId', 'doctorId', 'dateTime'];
        requiredFields.forEach(field => {
            if (!appointment[field]) errors.push(`${field} is required`);
        });
    }

    // DateTime validation
    if (appointment.dateTime) {
        const appointmentDate = new Date(appointment.dateTime);
        if (isNaN(appointmentDate.getTime())) {
            errors.push('Invalid dateTime format');
        }
    }

    // Status validation
    if (appointment.status && !['scheduled', 'completed', 'canceled', 'rescheduled'].includes(appointment.status)) {
        errors.push('Invalid status');
    }

    // Type validation
    if (appointment.type && !['general', 'follow-up'].includes(appointment.type)) {
        errors.push('Invalid appointment type');
    }

    // Duration validation
    if (appointment.duration && (typeof appointment.duration !== 'number' || appointment.duration <= 0)) {
        errors.push('Duration must be a positive number');
    }

    // Payment status validation
    if (appointment.paymentStatus && !['paid', 'unpaid', 'pending'].includes(appointment.paymentStatus)) {
        errors.push('Invalid payment status');
    }

    return errors;
};

// Single reference to HMS collection and appointments document
const getAppointmentsRef = () => db.collection('HMS').doc('appointments');

// Create new appointment
app.post('/appointments', async (req, res) => {
    try {
        const appointmentData = req.body;

        // Validate appointment data
        const validationErrors = validateAppointment(appointmentData);
        if (validationErrors.length > 0) {
            return res.status(400).send({ errors: validationErrors });
        }

        // Check if user and doctor exist
        const usersDoc = await getUsersRef().get();
        const users = usersDoc.data() || {};

        if (!users[appointmentData.userId]) {
            return res.status(400).send({ error: 'User not found' });
        }
        if (!users[appointmentData.doctorId]) {
            return res.status(400).send({ error: 'Doctor not found' });
        }

        // Check if doctor is actually a doctor
        if (users[appointmentData.doctorId].role !== 'doctor') {
            return res.status(400).send({ error: 'Selected user is not a doctor' });
        }

        // Check for appointment conflicts
        const appointmentsDoc = await getAppointmentsRef().get();
        const appointments = appointmentsDoc.data() || {};
        const appointmentDateTime = new Date(appointmentData.dateTime);
        const duration = appointmentData.duration || 30; // Default duration 30 minutes

        const hasConflict = Object.values(appointments).some(appointment => {
            if (appointment.doctorId === appointmentData.doctorId && appointment.status !== 'canceled') {
                const existingDateTime = new Date(appointment.dateTime);
                const timeDiff = Math.abs(existingDateTime - appointmentDateTime) / (1000 * 60); // difference in minutes
                return timeDiff < duration;
            }
            return false;
        });

        if (hasConflict) {
            return res.status(400).send({ error: 'Doctor is not available at this time' });
        }

        // Add timestamps and default values
        const now = new Date().toISOString();
        appointmentData.createdAt = now;
        appointmentData.updatedAt = now;
        appointmentData.dateTime = new Date(appointmentData.dateTime).toISOString();
        appointmentData.status = appointmentData.status || 'scheduled';
        appointmentData.type = appointmentData.type || 'general';
        appointmentData.duration = duration;
        appointmentData.paymentStatus = appointmentData.paymentStatus || 'pending';

        // Generate a unique ID
        const appointmentId = uuidv4();

        await getAppointmentsRef().set({
            [appointmentId]: appointmentData
        }, { merge: true });

        const updatedDoc = await getAppointmentsRef().get();
        res.status(201).send({ [appointmentId]: updatedDoc.data()[appointmentId] });
    } catch (error) {
        res.status(500).send('Error creating appointment: ' + error.message);
    }
});

// Update appointment
app.patch('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate update data
        const validationErrors = validateAppointment(updateData, true);
        if (validationErrors.length > 0) {
            return res.status(400).send({ errors: validationErrors });
        }

        const appointmentsDoc = await getAppointmentsRef().get();
        if (!appointmentsDoc.exists || !appointmentsDoc.data()[id]) {
            return res.status(404).send('Appointment not found');
        }

        // Update timestamp
        updateData.updatedAt = new Date().toISOString();

        // Convert dateTime to ISO string if present
        if (updateData.dateTime) {
            updateData.dateTime = new Date(updateData.dateTime).toISOString();
        }

        await getAppointmentsRef().set({
            [id]: { ...appointmentsDoc.data()[id], ...updateData }
        }, { merge: true });

        const updatedDoc = await getAppointmentsRef().get();
        res.status(200).send({ [id]: updatedDoc.data()[id] });
    } catch (error) {
        res.status(500).send('Error updating appointment: ' + error.message);
    }
});

// Cancel appointment
app.patch('/appointments/cancel/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const appointmentsDoc = await getAppointmentsRef().get();

        if (!appointmentsDoc.exists || !appointmentsDoc.data()[id]) {
            return res.status(404).send({ error: 'Appointment not found' });
        }

        const appointment = appointmentsDoc.data()[id];
        if (appointment.status === 'canceled') {
            return res.status(400).send({ error: 'Appointment is already canceled' });
        }

        await getAppointmentsRef().set({
            [id]: {
                ...appointment,
                status: 'canceled',
                updatedAt: new Date().toISOString()
            }
        }, { merge: true });

        const updatedDoc = await getAppointmentsRef().get();
        res.status(200).send({
            message: 'Appointment canceled successfully',
            appointment: updatedDoc.data()[id]
        });
    } catch (error) {
        res.status(500).send({ error: 'Error canceling appointment: ' + error.message });
    }
});

// Get appointments by user ID
app.get('/api/v1/appointments/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const appointmentsDoc = await getAppointmentsRef().get();

        if (!appointmentsDoc.exists) {
            return res.status(404).send('No appointments found');
        }

        const appointments = appointmentsDoc.data();
        const userAppointments = Object.entries(appointments)
            .filter(([_, appointment]) => appointment.userId === patientId)
            .reduce((acc, [id, appointment]) => ({ ...acc, [id]: appointment }), {});

        res.status(200).send(userAppointments);
    } catch (error) {
        res.status(500).send('Error fetching appointments: ' + error.message);
    }
});

// Get all unique specializations
app.get('/api/v1/specialists', async (req, res) => {
    try {
        const usersDoc = await getUsersRef().get();
        if (!usersDoc.exists) {
            return res.status(404).send({ specialists: [] });
        }

        const users = usersDoc.data();
        const specialists = [...new Set(
            Object.values(users)
                .filter(user => user.role === 'doctor' && user.specialization)
                .map(doctor => doctor.specialization)
        )];

        res.status(200).send({ specialists });
    } catch (error) {
        res.status(500).send('Error fetching specialists: ' + error.message);
    }
});

// Get appointments by doctor ID
app.get('/appointments/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        const appointmentsDoc = await getAppointmentsRef().get();

        if (!appointmentsDoc.exists) {
            return res.status(404).send('No appointments found');
        }

        const appointments = appointmentsDoc.data();
        const doctorAppointments = Object.entries(appointments)
            .filter(([_, appointment]) => appointment.doctorId === doctorId)
            .reduce((acc, [id, appointment]) => ({ ...acc, [id]: appointment }), {});

        res.status(200).send(doctorAppointments);
    } catch (error) {
        res.status(500).send('Error fetching appointments: ' + error.message);
    }
});

// Slot validation function
const validateSlot = (slot, isUpdate = false) => {
    const errors = [];

    // Required fields validation for new slots
    if (!isUpdate) {
        const requiredFields = ['doctorId', 'date', 'startTime', 'endTime', 'sessionDuration'];
        requiredFields.forEach(field => {
            if (!slot[field]) errors.push(`${field} is required`);
        });
    }

    // Time format validation
    const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (slot.startTime && !timeFormat.test(slot.startTime)) {
        errors.push('Invalid startTime format. Use 24-hour format (HH:mm)');
    }
    if (slot.endTime && !timeFormat.test(slot.endTime)) {
        errors.push('Invalid endTime format. Use 24-hour format (HH:mm)');
    }

    // Date validation
    if (slot.date) {
        const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateFormat.test(slot.date)) {
            errors.push('Invalid date format. Use YYYY-MM-DD');
        }
    }

    // Session duration validation
    if (slot.sessionDuration && (typeof slot.sessionDuration !== 'number' || slot.sessionDuration <= 0)) {
        errors.push('Session duration must be a positive number in minutes');
    }

    return errors;
};

// Single reference to HMS collection and slots document
const getSlotsRef = () => db.collection('HMS').doc('slots');

// Create or update doctor slots
app.post('/doctor/slots', async (req, res) => {
    try {
        const slotData = req.body;

        // Validate slot data
        const validationErrors = validateSlot(slotData);
        if (validationErrors.length > 0) {
            return res.status(400).send({ errors: validationErrors });
        }

        // Check if doctor exists and is actually a doctor
        const usersDoc = await getUsersRef().get();
        const users = usersDoc.data() || {};
        const doctor = users[slotData.doctorId];

        if (!doctor) {
            return res.status(400).send({ error: 'Doctor not found' });
        }
        if (doctor.role !== 'doctor') {
            return res.status(400).send({ error: 'Selected user is not a doctor' });
        }

        // Generate slots based on start time, end time and session duration
        const [startHour, startMinute] = slotData.startTime.split(':').map(Number);
        const [endHour, endMinute] = slotData.endTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        const duration = slotData.sessionDuration;

        const slots = [];
        for (let time = startTimeMinutes; time < endTimeMinutes; time += duration) {
            const hour = Math.floor(time / 60);
            const minute = time % 60;
            slots.push({
                time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                isBooked: false
            });
        }

        // Add timestamps and slots array
        const now = new Date().toISOString();
        const slotId = `${slotData.doctorId}_${slotData.date}`;
        const finalSlotData = {
            ...slotData,
            slots,
            createdAt: now,
            updatedAt: now
        };

        await getSlotsRef().set({
            [slotId]: finalSlotData
        }, { merge: true });

        const updatedDoc = await getSlotsRef().get();
        res.status(201).send({ [slotId]: updatedDoc.data()[slotId] });
    } catch (error) {
        res.status(500).send('Error creating slots: ' + error.message);
    }
});

// Get all slots for a specific doctor
app.get('/doctor/slots/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        const slotsDoc = await getSlotsRef().get();

        if (!slotsDoc.exists) {
            return res.status(404).send('No slots found');
        }

        const slots = slotsDoc.data();
        const doctorSlots = Object.entries(slots)
            .filter(([_, slot]) => slot.doctorId === doctorId)
            .reduce((acc, [id, slot]) => ({ ...acc, [id]: slot }), {});

        res.status(200).send(doctorSlots);
    } catch (error) {
        res.status(500).send('Error fetching slots: ' + error.message);
    }
});




// Update slot availability
app.patch('/doctor/slots/:doctorId/:date', async (req, res) => {
    try {
        const { doctorId, date } = req.params;
        const updateData = req.body;
        const slotId = `${doctorId}_${date}`;

        const slotsDoc = await getSlotsRef().get();
        if (!slotsDoc.exists || !slotsDoc.data()[slotId]) {
            return res.status(404).send('Slots not found');
        }

        const currentSlot = slotsDoc.data()[slotId];

        // Update specific slot availability
        if (updateData.time) {
            const slotIndex = currentSlot.slots.findIndex(s => s.time === updateData.time);
            if (slotIndex === -1) {
                return res.status(400).send({ error: 'Invalid slot time' });
            }
            currentSlot.slots[slotIndex].isBooked = updateData.isBooked ?? false;
        }

        // Update timestamp
        currentSlot.updatedAt = new Date().toISOString();

        await getSlotsRef().set({
            [slotId]: currentSlot
        }, { merge: true });

        const updatedDoc = await getSlotsRef().get();
        res.status(200).send({ [slotId]: updatedDoc.data()[slotId] });
    } catch (error) {
        res.status(500).send('Error updating slots: ' + error.message);
    }
});

app.listen(port, () => console.log(`Server has started on port: ${port}`));