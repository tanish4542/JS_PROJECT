import {asyncHandler} from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { upload } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
const registerUser =asyncHandler(async(req,res)=>{
    // user details from the frontend
    // check if non empty
    // check if user does not exist
    // check for images,check for avatar
    // upload them to cloudinary
    // check avatar is uploaded succesfully or not
    // create user object- create entry in db
    // remove password and refresh token field from response
    // check for user creation if successfull or not

    const {fullname,email,username,password}=req.body
    if([fullname,email,username,password].some((field=>field?.trim()===""))){
        throw new ApiError(400,"All fields are compulsory and required")
    }
    const existedUser=await User.findOne({
        $or:[{ username },{ email }]
    })
    if(existedUser)
    {
        throw new ApiError(409,"User already exists")
    }
    const avatarLocalpath=req.files?.avatar[0]?.path;
    //const coverImageLocalpath=req.files?.coverImage[0]?.path;

    let coverImageLocalpath;
    if(req.files&& Array.isArray(req.files.coverImage) && req.files.coverImage>0){
        coverImageLocalpath=req.files.coverImage[o].path;
    }
    if(!avatarLocalpath)
    {
        throw new ApiError(400,"avatar file is required")
    }
    const avatar=await upload(avatarLocalpath)
    const coverImage=await upload(coverImageLocalpath)
    if(!avatar)
    {
        throw new ApiError(400,"avatar file is required")
    }
    const user=await User.create(
        {fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createduser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createduser)
    {
        throw new ApiError(500,"Something went wrong while registering user")
    }
    return res.status(201).json(
        new ApiResponse(200,createduser,"User created successfully")
    )
})
export {
    registerUser,
}