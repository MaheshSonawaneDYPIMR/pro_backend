import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "dz7sclrjk",
  api_key: "458776276352346",
  api_secret: "PFTss1-ZnRSj24R_PFkNaKwx1_Y",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    console.log("Starting upload...");
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    

    console.log("Upload successful!");
    fs.unlinkSync(localFilePath);
    // File uploaded successfully

    return response;
  } catch (error) {
    console.log("Error uploading:", error);
    fs.unlinkSync(localFilePath); // Remove the locally saved temp file as the operation failed
  }
};

export { uploadOnCloudinary };
