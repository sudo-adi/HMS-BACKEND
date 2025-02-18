const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

// Get all patients
router.get('/', patientController.getAllPatients);

// Get patient by ID
router.get('/:id', patientController.getPatientById);

// Create new patient
router.post('/', patientController.createPatient);

// Update patient
router.patch('/:id', patientController.updatePatient);

// Delete patient(s)
router.delete('/:id', patientController.deletePatient);

module.exports = router;