const userService = require('../services/userService');
const { validateUser } = require('../utils/validators/userValidator');
const { v4: uuidv4 } = require('uuid');
const { FieldValue } = require('firebase-admin').firestore;

class UserController {
    // Get all users
    async getAllUsers(req, res) {
        try {
            const doc = await userService.getUsersRef().get();
            if (!doc.exists) {
                return res.status(404).send('No users found');
            }
            res.status(200).send(doc.data());
        } catch (error) {
            res.status(500).send('Error fetching users: ' + error.message);
        }
    }

    // Get user by ID
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const doc = await userService.getUsersRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).send('User not found');
            }
            res.status(200).send({ [id]: doc.data()[id] });
        } catch (error) {
            res.status(500).send('Error fetching user: ' + error.message);
        }
    }

    // Get user by email
    async getUserByEmail(req, res) {
        try {
            const { email } = req.params;
            const user = await userService.getUserByEmail(email);
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.status(200).send(user);
        } catch (error) {
            res.status(500).send('Error fetching user: ' + error.message);
        }
    }

    // Create new user
    async createUser(req, res) {
        try {
            const userData = req.body;

            // Validate user data
            const validationErrors = validateUser(userData);
            if (validationErrors.length > 0) {
                return res.status(400).send({ errors: validationErrors });
            }

            // Check for existing email or phone
            const doc = await userService.getUsersRef().get();
            const users = doc.data() || {};

            const emailExists = Object.values(users).some(user => user.email === userData.email);
            if (emailExists) {
                return res.status(400).send({ error: 'Email already exists' });
            }

            const phoneExists = Object.values(users).some(user => user.phone === userData.phone);
            if (phoneExists) {
                return res.status(400).send({ error: 'Phone number already exists' });
            }

            // Generate a unique ID using UUID v4
            const userId = uuidv4();

            // Create user with the generated UUID
            const createdUser = await userService.createUser(userId, userData);

            res.status(201).send({ [userId]: createdUser });
        } catch (error) {
            res.status(500).send('Error creating user: ' + error.message);
        }
    }

    // Update user
    async updateUser(req, res) {
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

            const doc = await userService.getUsersRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).send('User not found');
            }

            await userService.getUsersRef().set({
                [id]: { ...doc.data()[id], ...updateData }
            }, { merge: true });

            const updatedDoc = await userService.getUsersRef().get();
            res.status(200).send({ [id]: updatedDoc.data()[id] });
        } catch (error) {
            res.status(500).send('Error updating user: ' + error.message);
        }
    }

    // Delete user(s)
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const { ids } = req.body;

            // Handle multiple user deletion
            if (id === 'any' && Array.isArray(ids)) {
                const doc = await userService.getUsersRef().get();
                if (!doc.exists) {
                    return res.status(404).json({ error: "Users collection not found" });
                }

                const users = doc.data();
                const notFoundIds = ids.filter(id => !users[id]);

                if (notFoundIds.length > 0) {
                    return res.status(404).json({
                        error: "Some users not found",
                        notFoundIds
                    });
                }

                const updates = {};
                ids.forEach(id => {
                    updates[id] = FieldValue.delete();
                });

                await userService.getUsersRef().update(updates);
                return res.status(200).json({
                    message: `Successfully deleted ${ids.length} user(s)`,
                    deletedIds: ids
                });
            }

            // Handle single user deletion
            const doc = await userService.getUsersRef().get();
            if (!doc.exists || !doc.data()[id]) {
                return res.status(404).json({
                    error: "Some users not found",
                    notFoundIds: [id]
                });
            }

            await userService.deleteUser(id);
            res.status(200).json({
                message: "Successfully deleted 1 user(s)",
                deletedIds: [id]
            });
        } catch (error) {
            res.status(500).json({
                error: `Error deleting user(s): ${error.message}`
            });
        }
    }
}

module.exports = new UserController();