import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponce } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false } )

        return {accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Somthing went wrolng while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);

    const { fullName, email, username, password } = req.body;

    // Validation - not empty
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Get local file paths
    let avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Normalize paths for Cloudinary (Windows fix)
    avatarLocalPath = avatarLocalPath.replace(/\\/g, "/");
    if (coverImageLocalPath) {
        coverImageLocalPath = coverImageLocalPath.replace(/\\/g, "/");
    }

    // Upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar to Cloudinary");
    }

    // Create user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // Get user without password and refreshToken
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponce(201, createdUser, "User registered successfully")
    );
});



const loginUser = asyncHandler(async (req,res) => {
    // req.body -> data
    //username or email
    //find the user
    //password check
    //access and refresh Token
    //send cookie

    const {email, username, password} = req.body

    if (!username && !email) {
        throw new ApiError(400, "username or password is required")
    }

   const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404,"User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
    throw new ApiError(401,"password Incorrect");
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options =  {
    httpOnly:true,
    secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken,options)
   .cookie("refreshToken", refreshToken,options)
   .json(
    new ApiResponce(
        200,
        {
            user: loggedInUser, accessToken,refreshToken
        },
        "User  logged In successfully"
    )
   )
})
 
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: {refreshToken: undefined}},
        {new:true}
    );

    const options =  {
        httpOnly:true,
        secure: true
    };

    return res 
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponce(200,{}, " Usre logged out"))
});

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unathorized request")
    }

try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRETE
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invailed refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
            .status(200)
            .cookies("accessToken", accessToken, options)
            .cookies("refreshToken", newrefreshToken, options)
            .json( 
                new ApiResponce(200, {accessToken, refreshToken: newrefreshToken}, "Access token refreshed")
            )
    
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token");
    
}
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invailed old Password");
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponce(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponce(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) =>{
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponce(200,user, "Account detail update successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => 
{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    //delete old image not done 

    
const avatar = await uploadOnCloudinary(avatarLocalPath)

if(!avatar.url){
    throw new ApiError(400, "Error while uploading on avatar")
}

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{ avatar: avatar.url }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponce(200, user,"Avatar Image upload successfully")
    )


})

const updateUserCoverImage = asyncHandler(async(req, res) => 
{
    const coverImageLocalPath = req.file?.path

    if(!updateUserCoverImage){
        throw new ApiError(400, "Cover Image file is missing")
    }

const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!coverImage.url){
    throw new ApiError(400, "Error while uploading on coverImage")
}

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{ coverImage: coverImage.url }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponce(200, user,"Cover Image upload successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}

