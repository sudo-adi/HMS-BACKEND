const adminService = require('../services/adminService');
const { validateAdmin } = require('../utils/validators/adminValidator');
const { v4: uuidv4 } = require('uuid');
const { FieldValue } = require('firebase-admin').firestore;

class AdminController {
    // Get all admins
    async getAllAdmins(req, res) {
        try {
            const doc = await adminService.getAdminsRef().get();
            if (!doc.exists) {
                return res.status(404).send('No admins found');
            }
            res.status(200).send(doc.data());
        } catch (error) {
            res.status(500).send('Error fetching admins: ' + error.message);
        }
    }

    // Get admin by ID
    async getAdminById(req, res) {
        try {
            const { id } = req.params;
            const doc = await adminService.getAdminsRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).send('Admin not found');
            }
            res.status(200).send({ [id]: doc.data()[id] });
        } catch (error) {
            res.status(500).send('Error fetching admin: ' + error.message);
        }
    }

    // Create new admin
    async createAdmin(req, res) {
        try {
            const adminData = req.body;

            // Validate admin data
            const validationErrors = validateAdmin(adminData);
            if (validationErrors.length > 0) {
                return res.status(400).send({ errors: validationErrors });
            }

            // Check for existing email or phone
            const doc = await adminService.getAdminsRef().get();
            const admins = doc.data() || {};

            const emailExists = Object.values(admins).some(admin => admin.email === adminData.email);
            if (emailExists) {
                return res.status(400).send({ error: 'Email already exists' });
            }

            const phoneExists = Object.values(admins).some(admin => admin.phone === adminData.phone);
            if (phoneExists) {
                return res.status(400).send({ error: 'Phone number already exists' });
            }

            // Generate a unique ID using UUID v4
            const adminId = uuidv4();

            // Create admin with the generated UUID
            const createdAdmin = await adminService.createAdmin(adminId, adminData);

            res.status(201).send({ [adminId]: createdAdmin });
        } catch (error) {
            res.status(500).send('Error creating admin: ' + error.message);
        }
    }

    // Update admin
    async updateAdmin(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate update data
            const validationErrors = validateAdmin(updateData, true);
            if (validationErrors.length > 0) {
                return res.status(400).send({ errors: validationErrors });
            }

            // Update timestamp
            updateData.updatedAt = new Date().toISOString();

            const doc = await adminService.getAdminsRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).send('Admin not found');
            }

            await adminService.getAdminsRef().set({
                [id]: { ...doc.data()[id], ...updateData }
            }, { merge: true });

            const updatedDoc = await adminService.getAdminsRef().get();
            res.status(200).send({ [id]: updatedDoc.data()[id] });
        } catch (error) {
            res.status(500).send('Error updating admin: ' + error.message);
        }
    }

    // Delete admin(s)
    async deleteAdmin(req, res) {
        try {
            const { id } = req.params;
            const { ids } = req.body;

            // Handle multiple admin deletion
            if (id === 'any' && Array.isArray(ids)) {
                const doc = await adminService.getAdminsRef().get();
                if (!doc.exists) {
                    return res.status(404).json({ error: "Admins collection not found" });
                }

                const admins = doc.data();
                const notFoundIds = ids.filter(id => !admins[id]);

                if (notFoundIds.length > 0) {
                    return res.status(404).json({
                        error: "Some admins not found",
                        notFoundIds
                    });
                }

                const updates = {};
                ids.forEach(id => {
                    updates[id] = FieldValue.delete();
                });

                await adminService.getAdminsRef().update(updates);
                return res.status(200).json({
                    message: `Successfully deleted ${ids.length} admin(s)`,
                    deletedIds: ids
                });
            }

            // Handle single admin deletion
            const doc = await adminService.getAdminsRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).json({
                    error: "Some admins not found",
                    notFoundIds: [id]
                });
            }

            await adminService.deleteAdmin(id);
            res.status(200).json({
                message: "Successfully deleted 1 admin(s)",
                deletedIds: [id]
            });
        } catch (error) {
            res.status(500).json({
                error: `Error deleting admin(s): ${error.message}`
            });
        }
    }
}

module.exports = new AdminController();