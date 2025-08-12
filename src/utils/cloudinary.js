import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Windows path normalize + absolute path banaye
    const absolutePath = path.resolve(localFilePath).replace(/\\/g, "/");

    const result = await cloudinary.uploader.upload(absolutePath, {
      resource_type: "auto"
    });

    // File delete after upload
    fs.unlinkSync(localFilePath);

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

export { uploadOnCloudinary };
