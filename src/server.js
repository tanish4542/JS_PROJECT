import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js'; // ✅ IMPORT app from app.js

dotenv.config({ path: './.env' });

connectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`✅ Server running at: ${process.env.PORT}`);
    });
}).catch((error) => {
    console.error("❌ MongoDB connection failed", error);
});