const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin').firestore;

class UserService {
    constructor() {
        this.usersRef = db.collection('HMS').doc('users');
        this.initializeUsersDocument();
    }

    async initializeUsersDocument() {
        try {
            const doc = await this.usersRef.get();
            if (!doc.exists) {
                await this.usersRef.set({});
            }
        } catch (error) {
            console.error('Error initializing users document:', error);
        }
    }

    getUsersRef() {
        return this.usersRef;
    }

    async getAllUsers() {
        const doc = await this.usersRef.get();
        return doc.exists ? doc.data() : null;
    }

    async getUserById(id) {
        const doc = await this.usersRef.get();
        return doc.exists ? doc.data()[id] : null;
    }

    async getUserByEmail(email) {
        // Check in users collection
        const userDoc = await this.usersRef.get();
        if (userDoc.exists) {
            const users = userDoc.data();
            const user = Object.values(users).find(user => user.email === email);
            if (user) return { ...user, type: 'user' };
        }

        // Check in doctors collection
        const doctorDoc = await db.collection('doctors').get();
        if (doctorDoc.exists) {
            const doctors = doctorDoc.data();
            const doctor = Object.values(doctors).find(doc => doc.email === email);
            if (doctor) return { ...doctor, type: 'doctor' };
        }

        // Check in patients collection
        const patientDoc = await db.collection('patients').get();
        if (patientDoc.exists) {
            const patients = patientDoc.data();
            const patient = Object.values(patients).find(pat => pat.email === email);
            if (patient) return { ...patient, type: 'patient' };
        }

        // Check in admins collection
        const adminDoc = await db.collection('admins').get();
        if (adminDoc.exists) {
            const admins = adminDoc.data();
            const admin = Object.values(admins).find(adm => adm.email === email);
            if (admin) return { ...admin, type: 'admin' };
        }

        return null;
    }

    async createUser(userId, userData) {
        // Ensure the UUID is included inside the user object
        const userDataWithId = {
            id: userId,  // Explicitly add the UUID inside the object
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Convert DOB to ISO string if present
        if (userDataWithId.dob) {
            userDataWithId.dob = new Date(userDataWithId.dob).toISOString();
        }

        await this.usersRef.set({
            [userId]: userDataWithId  // Store it using the UUID as the key
        }, { merge: true });

        const doc = await this.usersRef.get();
        return doc.data()[userId];
    }


    async updateUser(userId, updateData) {
        await this.usersRef.set({
            [userId]: updateData
        }, { merge: true });
        const doc = await this.usersRef.get();
        return doc.data()[userId];
    }

    async deleteUser(userId) {
        await this.usersRef.update({
            [userId]: FieldValue.delete()
        });
        return true;
    }

    async checkEmailExists(email) {
        const doc = await this.usersRef.get();
        const users = doc.data() || {};
        return Object.values(users).some(user => user.email === email);
    }

    async checkPhoneExists(phone) {
        const doc = await this.usersRef.get();
        const users = doc.data() || {};
        return Object.values(users).some(user => user.phone === phone);
    }

    async searchUsersByEmail(email) {
        try {
            const [usersDoc, doctorsDoc, patientsDoc, adminsDoc] = await Promise.all([
                this.usersRef.get(),
                this.doctorsRef.get(),
                this.patientsRef.get(),
                this.adminsRef.get()
            ]);

            const users = usersDoc.data() || {};
            const doctors = doctorsDoc.data() || {};
            const patients = patientsDoc.data() || {};
            const admins = adminsDoc.data() || {};

            const results = [];

            // Search in doctors
            Object.entries(doctors).forEach(([id, doctor]) => {
                if (doctor.email && doctor.email.toLowerCase().includes(email.toLowerCase())) {
                    results.push({
                        id,
                        ...doctor,
                        userType: 'doctor'
                    });
                }
            });

            // Search in patients
            Object.entries(patients).forEach(([id, patient]) => {
                if (patient.email && patient.email.toLowerCase().includes(email.toLowerCase())) {
                    results.push({
                        id,
                        ...patient,
                        userType: 'patient'
                    });
                }
            });

            // Search in admins
            Object.entries(admins).forEach(([id, admin]) => {
                if (admin.email && admin.email.toLowerCase().includes(email.toLowerCase())) {
                    results.push({
                        id,
                        ...admin,
                        userType: 'admin'
                    });
                }
            });

            return results;
        } catch (error) {
            throw new Error('Error searching users by email: ' + error.message);
        }
    }
}

module.exports = new UserService();