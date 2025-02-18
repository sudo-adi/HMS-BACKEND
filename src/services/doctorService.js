const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin').firestore;

class DoctorService {
    constructor() {
        this.doctorsRef = db.collection('HMS').doc('doctors');
        this.initializeDoctorsDocument();
    }

    async initializeDoctorsDocument() {
        try {
            const doc = await this.doctorsRef.get();
            if (!doc.exists) {
                await this.doctorsRef.set({});
            }
        } catch (error) {
            console.error('Error initializing doctors document:', error);
        }
    }

    getDoctorsRef() {
        return this.doctorsRef;
    }

    async getAllDoctors() {
        const doc = await this.doctorsRef.get();
        return doc.exists ? doc.data() : null;
    }

    async getDoctorById(id) {
        const doc = await this.doctorsRef.get();
        return doc.exists ? doc.data()[id] : null;
    }

    async createDoctor(doctorId, doctorData) {
        const doctorDataWithId = {
            id: doctorId,
            ...doctorData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.doctorsRef.set({
            [doctorId]: doctorDataWithId
        }, { merge: true });

        const doc = await this.doctorsRef.get();
        return doc.data()[doctorId];
    }

    async updateDoctor(doctorId, updateData) {
        await this.doctorsRef.set({
            [doctorId]: updateData
        }, { merge: true });
        const doc = await this.doctorsRef.get();
        return doc.data()[doctorId];
    }

    async deleteDoctor(doctorId) {
        await this.doctorsRef.update({
            [doctorId]: FieldValue.delete()
        });
        return true;
    }

    async checkEmailExists(email) {
        const doc = await this.doctorsRef.get();
        const doctors = doc.data() || {};
        return Object.values(doctors).some(doctor => doctor.email === email);
    }

    async checkPhoneExists(phone) {
        const doc = await this.doctorsRef.get();
        const doctors = doc.data() || {};
        return Object.values(doctors).some(doctor => doctor.phone === phone);
    }
}

module.exports = new DoctorService();