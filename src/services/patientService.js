const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin').firestore;

class PatientService {
    constructor() {
        this.patientsRef = db.collection('HMS').doc('patients');
        this.initializePatientsDocument();
    }

    async initializePatientsDocument() {
        try {
            const doc = await this.patientsRef.get();
            if (!doc.exists) {
                await this.patientsRef.set({});
            }
        } catch (error) {
            console.error('Error initializing patients document:', error);
        }
    }

    getPatientsRef() {
        return this.patientsRef;
    }

    async getAllPatients() {
        const doc = await this.patientsRef.get();
        return doc.exists ? doc.data() : null;
    }

    async getPatientById(id) {
        const doc = await this.patientsRef.get();
        return doc.exists ? doc.data()[id] : null;
    }

    async createPatient(patientId, patientData) {
        const patientDataWithId = {
            id: patientId,
            ...patientData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.patientsRef.set({
            [patientId]: patientDataWithId
        }, { merge: true });

        const doc = await this.patientsRef.get();
        return doc.data()[patientId];
    }

    async updatePatient(patientId, updateData) {
        await this.patientsRef.set({
            [patientId]: updateData
        }, { merge: true });
        const doc = await this.patientsRef.get();
        return doc.data()[patientId];
    }

    async deletePatient(patientId) {
        await this.patientsRef.update({
            [patientId]: FieldValue.delete()
        });
        return true;
    }

    async checkEmailExists(email) {
        const doc = await this.patientsRef.get();
        const patients = doc.data() || {};
        return Object.values(patients).some(patient => patient.email === email);
    }

    async checkPhoneExists(phone) {
        const doc = await this.patientsRef.get();
        const patients = doc.data() || {};
        return Object.values(patients).some(patient => patient.phone === phone);
    }
}

module.exports = new PatientService();