const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('Current Users in DB:');
        users.forEach(u => {
            console.log({
                email: u.email,
                role: u.role,
                isAdmin: u.isAdmin,
                isApproved: u.isApproved,
                id: u._id
            });
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
