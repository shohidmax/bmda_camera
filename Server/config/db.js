const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Disable buffer commands so queries fail fast if connection is down
    mongoose.set('bufferCommands', false);
    
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/camera_security', {
      serverSelectionTimeoutMS: 2000 // 2 seconds timeout
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.dbConnected = true;
  } catch (error) {
    console.warn(`\n[DB WARNING] Database Connection Failed: ${error.message}`);
    console.warn(`[DB WARNING] Aegis Eye will run in In-Memory Mode. Changes will not persist after restart.\n`);
    global.dbConnected = false;
  }
};

module.exports = connectDB;
