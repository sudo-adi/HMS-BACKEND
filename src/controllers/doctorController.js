const doctorService = require('../services/doctorService');
const { validateDoctor } = require('../utils/validators/doctorValidator');
const { v4: uuidv4 } = require('uuid');
const { FieldValue } = require('firebase-admin').firestore;

class DoctorController {
    // Get all doctors
    async getAllDoctors(req, res) {
        try {
            const doc = await doctorService.getDoctorsRef().get();
            if (!doc.exists) {
                return res.status(404).send('No doctors found');
            }
            res.status(200).send(doc.data());
        } catch (error) {
            res.status(500).send('Error fetching doctors: ' + error.message);
        }
    }

    // Get doctor by ID
    async getDoctorById(req, res) {
        try {
            const { id } = req.params;
            const doc = await doctorService.getDoctorsRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).send('Doctor not found');
            }
            res.status(200).send({ [id]: doc.data()[id] });
        } catch (error) {
            res.status(500).send('Error fetching doctor: ' + error.message);
        }
    }

    // Create new doctor
    async createDoctor(req, res) {
        try {
            const doctorData = req.body;

            // Validate doctor data
            const validationErrors = validateDoctor(doctorData);
            if (validationErrors.length > 0) {
                return res.status(400).send({ errors: validationErrors });
            }

            // Check for existing email or phone
            const doc = await doctorService.getDoctorsRef().get();
            const doctors = doc.data() || {};

            const emailExists = Object.values(doctors).some(doctor => doctor.email === doctorData.email);
            if (emailExists) {
                return res.status(400).send({ error: 'Email already exists' });
            }

            const phoneExists = Object.values(doctors).some(doctor => doctor.phone === doctorData.phone);
            if (phoneExists) {
                return res.status(400).send({ error: 'Phone number already exists' });
            }

            // Generate a unique ID using UUID v4
            const doctorId = uuidv4();

            // Create doctor with the generated UUID
            const createdDoctor = await doctorService.createDoctor(doctorId, doctorData);

            res.status(201).send({ [doctorId]: createdDoctor });
        } catch (error) {
            res.status(500).send('Error creating doctor: ' + error.message);
        }
    }

    // Update doctor
    async updateDoctor(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate update data
            const validationErrors = validateDoctor(updateData, true);
            if (validationErrors.length > 0) {
                return res.status(400).send({ errors: validationErrors });
            }

            // Update timestamp
            updateData.updatedAt = new Date().toISOString();

            const doc = await doctorService.getDoctorsRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).send('Doctor not found');
            }

            await doctorService.getDoctorsRef().set({
                [id]: { ...doc.data()[id], ...updateData }
            }, { merge: true });

            const updatedDoc = await doctorService.getDoctorsRef().get();
            res.status(200).send({ [id]: updatedDoc.data()[id] });
        } catch (error) {
            res.status(500).send('Error updating doctor: ' + error.message);
        }
    }

    // Delete doctor(s)
    async deleteDoctor(req, res) {
        try {
            const { id } = req.params;
            const { ids } = req.body;

            // Handle multiple doctor deletion
            if (id === 'any' && Array.isArray(ids)) {
                const doc = await doctorService.getDoctorsRef().get();
                if (!doc.exists) {
                    return res.status(404).json({ error: "Doctors collection not found" });
                }

                const doctors = doc.data();
                const notFoundIds = ids.filter(id => !doctors[id]);

                if (notFoundIds.length > 0) {
                    return res.status(404).json({
                        error: "Some doctors not found",
                        notFoundIds
                    });
                }

                const updates = {};
                ids.forEach(id => {
                    updates[id] = FieldValue.delete();
                });

                await doctorService.getDoctorsRef().update(updates);
                return res.status(200).json({
                    message: `Successfully deleted ${ids.length} doctor(s)`,
                    deletedIds: ids
                });
            }

            // Handle single doctor deletion
            const doc = await doctorService.getDoctorsRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).json({
                    error: "Some doctors not found",
                    notFoundIds: [id]
                });
            }

            await doctorService.deleteDoctor(id);
            res.status(200).json({
                message: "Successfully deleted 1 doctor(s)",
                deletedIds: [id]
            });
        } catch (error) {
            res.status(500).json({
                error: `Error deleting doctor(s): ${error.message}`
            });
        }
    }
}

module.exports = new DoctorController();