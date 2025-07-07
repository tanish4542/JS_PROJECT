import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from "dotenv";
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const upload = async (filePath) => {
  try {
    if (!filePath) return null;

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
    });

    fs.unlinkSync(filePath); // ✅ delete local file after successful upload
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (err) {
    console.error('❌ Cloudinary Upload Error:', err.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return null;
  }
};