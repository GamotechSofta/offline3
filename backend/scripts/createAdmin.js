import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from '../models/admin/admin.js';
import connectDB from '../config/db_Connection.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await connectDB();
        
        const username = process.argv[2] || 'admin';
        const password = process.argv[3] || 'admin123456';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            await Admin.collection.updateOne(
                { _id: existingAdmin._id },
                { $set: { password: hashedPassword, role: 'super_admin', status: 'active', updatedAt: new Date() } }
            );
            console.log(`✅ Super admin "${username}" already existed; password updated.`);
        } else {
            await Admin.collection.insertOne({
                username,
                password: hashedPassword,
                role: 'super_admin',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`✅ Super admin created successfully!`);
        }
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        if (!existingAdmin) console.log(`\n⚠️  Please change the default password after first login!`);
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

createAdmin();
