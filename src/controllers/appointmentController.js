const appointmentService = require('../services/appointmentService');
const userService = require('../services/userService');
const { validateAppointment } = require('../utils/validators/appointmentValidator');
const { v4: uuidv4 } = require('uuid');

class AppointmentController {
    // Create new appointment
    async createAppointment(req, res) {
        try {
            const appointmentData = req.body;

            // Validate appointment data
            const validationErrors = validateAppointment(appointmentData);
            if (validationErrors.length > 0) {
                return res.status(400).send({ errors: validationErrors });
            }

            // Check if user and doctor exist
            const usersDoc = await userService.getUsersRef().get();
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
            const appointmentsDoc = await appointmentService.getAppointmentsRef().get();
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

            const createdAppointment = await appointmentService.createAppointment(appointmentId, appointmentData);
            res.status(201).send({ [appointmentId]: createdAppointment });
        } catch (error) {
            res.status(500).send('Error creating appointment: ' + error.message);
        }
    }

    // Update appointment
    async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate update data
            const validationErrors = validateAppointment(updateData, true);
            if (validationErrors.length > 0) {
                return res.status(400).send({ errors: validationErrors });
            }

            const updatedAppointment = await appointmentService.updateAppointment(id, updateData);
            res.status(200).send({ [id]: updatedAppointment });
        } catch (error) {
            if (error.message === 'Appointment not found') {
                return res.status(404).send('Appointment not found');
            }
            res.status(500).send('Error updating appointment: ' + error.message);
        }
    }

    // Cancel appointment
    async cancelAppointment(req, res) {
        try {
            const { id } = req.params;
            const updatedAppointment = await appointmentService.cancelAppointment(id);

            res.status(200).send({
                message: 'Appointment canceled successfully',
                appointment: updatedAppointment
            });
        } catch (error) {
            if (error.message === 'Appointment not found') {
                return res.status(404).send({ error: 'Appointment not found' });
            }
            if (error.message === 'Appointment is already canceled') {
                return res.status(400).send({ error: 'Appointment is already canceled' });
            }
            res.status(500).send({ error: 'Error canceling appointment: ' + error.message });
        }
    }

    // Get appointments by user ID
    async getAppointmentsByUserId(req, res) {
        try {
            const { patientId } = req.params;
            const userAppointments = await appointmentService.getAppointmentsByUserId(patientId);
            res.status(200).send(userAppointments);
        } catch (error) {
            res.status(500).send('Error fetching appointments: ' + error.message);
        }
    }

    // Get appointments by doctor ID
    async getAppointmentsByDoctorId(req, res) {
        try {
            const { doctorId } = req.params;
            const doctorAppointments = await appointmentService.getAppointmentsByDoctorId(doctorId);
            res.status(200).send(doctorAppointments);
        } catch (error) {
            res.status(500).send('Error fetching appointments: ' + error.message);
        }
    }

    // Get appointment by ID
    async getAppointmentById(req, res) {
        try {
            const { id } = req.params;
            const appointmentData = await appointmentService.getAppointmentById(id);

            if (!appointmentData) {
                return res.status(404).send('Appointment not found');
            }

            res.status(200).send({ [id]: appointmentData });
        } catch (error) {
            res.status(500).send('Error fetching appointment: ' + error.message);
        }
    }
}

module.exports = new AppointmentController();