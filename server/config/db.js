const mongoose = require('mongoose');
let isConnected = false;

const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log('MongoDB already connected');
        return;
    }

    // Reset connection state if mongoose is disconnected
    if (mongoose.connection.readyState === 0) {
        isConnected = false;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('MONGODB_URI environment variable is not set');
        throw new Error('Database configuration error: MONGODB_URI is missing');
    }

    try {
        // Set mongoose options for serverless environment
        mongoose.set('bufferCommands', false);

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            socketTimeoutMS: 45000, // 45 second socket timeout
        });

        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        isConnected = false;
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;
