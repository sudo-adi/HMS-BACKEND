const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin').firestore;

class AdminService {
    constructor() {
        this.adminsRef = db.collection('HMS').doc('admins');
        this.initializeAdminsDocument();
    }

    async initializeAdminsDocument() {
        try {
            const doc = await this.adminsRef.get();
            if (!doc.exists) {
                await this.adminsRef.set({});
            }
        } catch (error) {
            console.error('Error initializing admins document:', error);
        }
    }

    getAdminsRef() {
        return this.adminsRef;
    }

    async getAllAdmins() {
        const doc = await this.adminsRef.get();
        return doc.exists ? doc.data() : null;
    }

    async getAdminById(id) {
        const doc = await this.adminsRef.get();
        return doc.exists ? doc.data()[id] : null;
    }

    async createAdmin(adminId, adminData) {
        const adminDataWithId = {
            id: adminId,
            ...adminData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.adminsRef.set({
            [adminId]: adminDataWithId
        }, { merge: true });

        const doc = await this.adminsRef.get();
        return doc.data()[adminId];
    }

    async updateAdmin(adminId, updateData) {
        await this.adminsRef.set({
            [adminId]: updateData
        }, { merge: true });
        const doc = await this.adminsRef.get();
        return doc.data()[adminId];
    }

    async deleteAdmin(adminId) {
        await this.adminsRef.update({
            [adminId]: FieldValue.delete()
        });
        return true;
    }

    async checkEmailExists(email) {
        const doc = await this.adminsRef.get();
        const admins = doc.data() || {};
        return Object.values(admins).some(admin => admin.email === email);
    }

    async checkPhoneExists(phone) {
        const doc = await this.adminsRef.get();
        const admins = doc.data() || {};
        return Object.values(admins).some(admin => admin.phone === phone);
    }
}

module.exports = new AdminService();