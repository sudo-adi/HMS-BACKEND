const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Get user by email
router.get('/email/:email', userController.getUserByEmail);

// Create new user
router.post('/', userController.createUser);

// Update user
router.patch('/:id', userController.updateUser);

// Delete user(s)
router.delete('/:id', userController.deleteUser);

module.exports = router;