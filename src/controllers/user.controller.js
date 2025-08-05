import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User, user} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponce} from "../utils/ApiError.js"

import { use } from "react";


const registerUser = asyncHandler( async (req, res) =>{
    // get user detail from frontend
    // Validation- not empty
    // check if user is already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user Object - create entry in DB
    // remove password and refreshToken field from responce
    // check for user creation
    // return response  

    const {fullname, email, username, password} = req.body;
    console.log("email:", email); 

   if( 
    [fullname, email, username, password].some((field) => 
    field?.trim() === "")
   ){
        throw new ApiError(400, "All field are required")
   }
    
   const existedUser = User.findOne({
    $or: [{username}, {email}]
   })

   if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
   }

   const avatarLocalPath =  req.files?.avatar[0]?.path;
   const coverImageLocalPath =   req.fiels?.coverImage[0]?.path;

   if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
   }
 
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

     if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
   }

   const user = await User.create({
    fullname,
    avatar : avatar.url,
    coverImage: coverImage.url,
    email,
    password,
    username: username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

    if (!createdUser) {
        throw new ApiError(500, "Somthing went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponce(201, createdUser, "User registered Successfully")
    )
}) 

export {registerUser}