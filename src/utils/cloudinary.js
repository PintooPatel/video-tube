import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET

});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary
        const respose = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        // file hasbeen uploaded successfull
        //console.log("File is uploded in cloudinary", respose.url);
        fs.unlinkSyc(localFilePath);
        return respose;
    } catch (error) {
        fs.unlinkSync(localFilePath)// remove the locally saved temporary file as the upload operation got failed
        return null
    }
}

export {uploadOnCloudinary}