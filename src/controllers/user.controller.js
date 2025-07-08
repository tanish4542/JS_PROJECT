import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { upload } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import { json } from 'stream/consumers';
import { subscribe } from 'diagnostics_channel';
import mongoose from 'mongoose';

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

const changeUserPassword=asyncHandler(async(req,res)=>
{
    const{oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect()
    if(!isPasswordCorrect)
    {
        throw new ApiError(400,"Old Invalid Password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed succefully"))

})

const getCurrentUser=asyncHandler(async(req,res)=>
{
    return res.status(200).json(new ApiResponse(200,res.user,"Current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>
{
    const{fullname,email}=req.body
    if(!fullname || !email)
    {
        throw new ApiError(400,"All fields are required")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {$set:{
            fullname,
            email
        }},
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalpath=req.files?.path
    if(!avatarLocalpath)
    {
        new ApiError(400,"Avatar file is missing")
    }
    const avatarupload= await upload(avatarLocalpath)
    if(!avatarupload.url)
    {
        throw new ApiError(400,"Error while uploading an avatar")
    }
    const user=await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },{
            new:true
        }
    ).select("-password")

    res.status(200).
    json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalpathpath=req.files?.path
    if(!coverImageLocalpathpath)
    {
        new ApiError(400,"Cover file is missing")
    }
    const coverImage= await upload(coverImageLocalpathpath)
    if(!coverImage.url)
    {
        throw new ApiError(400,"Error while uploading the image")
    }
    const user=await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },{
            new:true
        }
    ).select("-password")
    res.status(200).
    json(new ApiResponse(200,user,"Cover image updated successfully"))
})

const getUserChannelProfile=asyncHandler(async(req,res)=>
{
    const{username}=req.params
    if(!username?.trim())
    {
        throw new ApiError(400,"Username is missing")
    }
    const channel=await User.aggregate(
        [{
            $match:username?.toLowerCase()
        },
        {
            $lookup:
            {
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:
            {
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"Subscribedto"
            }
        },
        {
            $addFields:
            {
                subscribersCount:{
                    $size:"$subcribers"
                },
                channelsSubscribedToCount:
                {
                    $size:"$Subscribedto"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subcriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:
            {
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
        ])
    if(!channel?.length)
    {
        throw new ApiError(404,"Channel does not exist")
    }
    return res.status(200)
    .json(new ApiResponse(
        200,
        channel[0],
        "User channel fetched succefully"
    ))

})

const getWatchHistory = asyncHandler(async (req, res) => {
    const result = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                watchHistory: 1
            }
        }
    ]);

    res.status(200).json(new ApiResponse(200,user[0].watchHistory,"Watch histroy fetched succefully"));
});
export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    getCurrentUser,
    changeUserPassword,
    updateAccountDetails,
    updateAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};