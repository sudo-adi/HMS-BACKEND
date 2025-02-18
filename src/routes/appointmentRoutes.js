const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Create new appointment
router.post('/', appointmentController.createAppointment);

// Get appointments by user ID
router.get('/patient/:patientId', appointmentController.getAppointmentsByUserId);

// Get appointments by doctor ID
router.get('/doctor/:doctorId', appointmentController.getAppointmentsByDoctorId);

// Cancel appointment
router.patch('/cancel/:id', appointmentController.cancelAppointment);

// Update appointment
router.patch('/:id', appointmentController.updateAppointment);

// Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

module.exports = router;