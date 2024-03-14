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

    const responce = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    //file uploaded successfully

    return responce.url;
  } catch (error) {
    console.log("Error uploading", error);
    fs.unlinkSync(localFilePath); //remove the localy save temp file as the opration got failed
  }
};

export { uploadOnCloudinary };
