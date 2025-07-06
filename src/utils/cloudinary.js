import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

const upload=async(filePath)=>{
    try{
        if(!filePath) return null;
        //uploading the file to cloudinary
        const response=cloudinary.uploader.upload(filePath,
            {resource_type: "auto"}, // Automatically detect the resource type
        );
        console.log("File uploaded successfully to Cloudinary");
        return response; 
    }
    catch(err){
        fs.unlinkSync(filePath); // Delete the file from local storage
    }
};


cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
});
