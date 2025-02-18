const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const { db } = require('./config/firebase');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());


// Import route modules
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const patientRoutes = require('./routes/patientRoutes');

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/patients', patientRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).send({ status: 'OK' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).send({
        status: 404,
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
});

module.exports = app;
