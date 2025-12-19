const mongoose = require('mongoose');
let isConnected = false;
const connectDB = async () => {
    if (isConnected) {
        console.log('MongoDB already connected');
        return;
    }

    try {

        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bhojan_app');
        isConnected = true;
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        throw error; // Don't exit process on Vercel
    }
};

module.exports = connectDB;
