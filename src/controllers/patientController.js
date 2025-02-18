const patientService = require('../services/patientService');
const { validatePatient } = require('../utils/validators/patientValidator');
const { v4: uuidv4 } = require('uuid');
const { FieldValue } = require('firebase-admin').firestore;

class PatientController {
    // Get all patients
    async getAllPatients(req, res) {
        try {
            const doc = await patientService.getPatientsRef().get();
            if (!doc.exists) {
                return res.status(404).send('No patients found');
            }
            res.status(200).send(doc.data());
        } catch (error) {
            res.status(500).send('Error fetching patients: ' + error.message);
        }
    }

    // Get patient by ID
    async getPatientById(req, res) {
        try {
            const { id } = req.params;
            const doc = await patientService.getPatientsRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).send('Patient not found');
            }
            res.status(200).send({ [id]: doc.data()[id] });
        } catch (error) {
            res.status(500).send('Error fetching patient: ' + error.message);
        }
    }

    // Create new patient
    async createPatient(req, res) {
        try {
            const patientData = req.body;

            // Validate patient data
            const validationErrors = validatePatient(patientData);
            if (validationErrors.length > 0) {
                return res.status(400).send({ errors: validationErrors });
            }

            // Check for existing email or phone
            const doc = await patientService.getPatientsRef().get();
            const patients = doc.data() || {};

            const emailExists = Object.values(patients).some(patient => patient.email === patientData.email);
            if (emailExists) {
                return res.status(400).send({ error: 'Email already exists' });
            }

            const phoneExists = Object.values(patients).some(patient => patient.phone === patientData.phone);
            if (phoneExists) {
                return res.status(400).send({ error: 'Phone number already exists' });
            }

            // Generate a unique ID using UUID v4
            const patientId = uuidv4();

            // Create patient with the generated UUID
            const createdPatient = await patientService.createPatient(patientId, patientData);

            res.status(201).send({ [patientId]: createdPatient });
        } catch (error) {
            res.status(500).send('Error creating patient: ' + error.message);
        }
    }

    // Update patient
    async updatePatient(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate update data
            const validationErrors = validatePatient(updateData, true);
            if (validationErrors.length > 0) {
                return res.status(400).send({ errors: validationErrors });
            }

            // Update timestamp
            updateData.updatedAt = new Date().toISOString();

            const doc = await patientService.getPatientsRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).send('Patient not found');
            }

            await patientService.getPatientsRef().set({
                [id]: { ...doc.data()[id], ...updateData }
            }, { merge: true });

            const updatedDoc = await patientService.getPatientsRef().get();
            res.status(200).send({ [id]: updatedDoc.data()[id] });
        } catch (error) {
            res.status(500).send('Error updating patient: ' + error.message);
        }
    }

    // Delete patient(s)
    async deletePatient(req, res) {
        try {
            const { id } = req.params;
            const { ids } = req.body;

            // Handle multiple patient deletion
            if (id === 'any' && Array.isArray(ids)) {
                const doc = await patientService.getPatientsRef().get();
                if (!doc.exists) {
                    return res.status(404).json({ error: "Patients collection not found" });
                }

                const patients = doc.data();
                const notFoundIds = ids.filter(id => !patients[id]);

                if (notFoundIds.length > 0) {
                    return res.status(404).json({
                        error: "Some patients not found",
                        notFoundIds
                    });
                }

                const updates = {};
                ids.forEach(id => {
                    updates[id] = FieldValue.delete();
                });

                await patientService.getPatientsRef().update(updates);
                return res.status(200).json({
                    message: `Successfully deleted ${ids.length} patient(s)`,
                    deletedIds: ids
                });
            }

            // Handle single patient deletion
            const doc = await patientService.getPatientsRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).json({
                    error: "Some patients not found",
                    notFoundIds: [id]
                });
            }

            await patientService.deletePatient(id);
            res.status(200).json({
                message: "Successfully deleted 1 patient(s)",
                deletedIds: [id]
            });
        } catch (error) {
            res.status(500).json({
                error: `Error deleting patient(s): ${error.message}`
            });
        }
    }
}

module.exports = new PatientController();