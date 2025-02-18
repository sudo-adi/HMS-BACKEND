const { db } = require('../config/firebase');

class AppointmentService {
    constructor() {
        this.appointmentsRef = db.collection('HMS').doc('appointments');
    }

    getAppointmentsRef() {
        return this.appointmentsRef;
    }

    async getAllAppointments() {
        const doc = await this.appointmentsRef.get();
        return doc.exists ? doc.data() : null;
    }

    async getAppointmentById(id) {
        const doc = await this.appointmentsRef.get();
        if (!doc.exists) {
            // Initialize empty appointments document if it doesn't exist
            await this.appointmentsRef.set({});
            return null;
        }
        return doc.data()[id] || null;
    }

    async createAppointment(appointmentId, appointmentData) {
        await this.appointmentsRef.set({
            [appointmentId]: appointmentData
        }, { merge: true });
        const doc = await this.appointmentsRef.get();
        return doc.data()[appointmentId];
    }

    async updateAppointment(appointmentId, updateData) {
        const doc = await this.appointmentsRef.get();
        if (!doc.exists || !doc.data()[appointmentId]) {
            throw new Error('Appointment not found');
        }

        const updatedAppointment = {
            ...doc.data()[appointmentId],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        await this.appointmentsRef.set({
            [appointmentId]: updatedAppointment
        }, { merge: true });

        return updatedAppointment;
    }

    async cancelAppointment(appointmentId) {
        const doc = await this.appointmentsRef.get();
        if (!doc.exists || !doc.data()[appointmentId]) {
            throw new Error('Appointment not found');
        }

        const appointment = doc.data()[appointmentId];
        if (appointment.status === 'canceled') {
            throw new Error('Appointment is already canceled');
        }

        const updatedAppointment = {
            ...appointment,
            status: 'canceled',
            updatedAt: new Date().toISOString()
        };

        await this.appointmentsRef.set({
            [appointmentId]: updatedAppointment
        }, { merge: true });

        return updatedAppointment;
    }

    async getAppointmentsByUserId(userId) {
        const doc = await this.appointmentsRef.get();
        if (!doc.exists) return {};

        const appointments = doc.data();
        return Object.entries(appointments)
            .filter(([_, appointment]) => appointment.userId === userId)
            .reduce((acc, [id, appointment]) => ({ ...acc, [id]: appointment }), {});
    }

    async getAppointmentsByDoctorId(doctorId) {
        const doc = await this.appointmentsRef.get();
        if (!doc.exists) return {};

        const appointments = doc.data();
        return Object.entries(appointments)
            .filter(([_, appointment]) => appointment.doctorId === doctorId)
            .reduce((acc, [id, appointment]) => ({ ...acc, [id]: appointment }), {});
    }
}

module.exports = new AppointmentService();