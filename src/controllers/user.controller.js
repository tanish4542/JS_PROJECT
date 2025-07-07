import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { upload } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import { json } from 'stream/consumers';

// Token generator function
const generatAccessandRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accesstoken = user.generateAccestoken();
        const refreshtoken = user.generateRefreshtoken();
        user.refreshToken = refreshtoken;
        await user.save({ validateBeforeSave: false });
        return { refreshtoken, accesstoken };
    } catch (err) {
        throw new ApiError(500, "Something went wrong while generating access or refresh token");
    }
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some(field => !field?.trim())) {
        throw new ApiError(400, "All fields are compulsory and required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalpath = req.files?.avatar?.[0]?.path;
    let coverImageLocalpath;

    if (req.files?.coverImage?.length > 0) {
        coverImageLocalpath = req.files.coverImage[0].path;
    }

    if (!avatarLocalpath) {
        throw new ApiError(400, "avatar file is required");
    }

    const avatar = await upload(avatarLocalpath);
    const coverImage = await upload(coverImageLocalpath);

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createduser = await User.findById(user._id).select("-password -refreshToken");

    if (!createduser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res.status(201).json(
        new ApiResponse(200, createduser, "User created successfully")
    );
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    }).select("+password"); // Include password

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const valid_password = await user.isPasswordCorrect(password);
    if (!valid_password) {
        throw new ApiError(401, "Password incorrect");
    }

    const { accesstoken, refreshtoken } = await generatAccessandRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-refreshToken -password");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
        .cookie("AccessToken", accesstoken, options)
        .cookie("RefreshToken", refreshtoken, options)
        .json(new ApiResponse(200, {
            user: loggedInUser,
            accesstoken,
            refreshtoken
        }, "User logged in successfully"));
});

// Logout User
const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    });

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
        .clearCookie("AccessToken", options)
        .clearCookie("RefreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

try {
    const refreshAccessToken=asyncHandler(async(req,res)=>{
          req.cookies.refreshToken || req.body.refreshToken
    
          if(!refreshAccessToken){
            throw new ApiError(401,"Unauthorized request")
          }
          const decodedToken=jwt.verify(refreshAccessToken,process.env.REFRESH_TOKEN_SECRET)
    
          const user=await User.findById(decodedToken?._id)
          if(!user){
            throw new ApiError(401,"Invalid refresh token")
          }
    
          if(refreshAccessToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
          }
          const options = {
            httpOnly: true,
            secure: true
        };
        const {accesstoken,newrefreshtoken}=await generatAccessandRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accesstoken",accesstoken,options)
        .cookie("refreshtoken",newrefreshtoken,options),
        json(
            new ApiResponse(
                200,
                {
                    accesstoken,refreshToken:newrefreshtoken
                },
                "Access token refreshed successfully"
            )
        )
}
)}catch (error) {
    throw new ApiError(401,"Invalid refresh token")
}



export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
};