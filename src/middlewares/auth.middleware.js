import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.AccessToken || 
            req.header("Authorization")?.replace("Bearer ", "").trim(); // ✅ fixed space issue

        if (!token) {
            throw new ApiError(401, "Unauthorized access: Token missing");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid access token: User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("❌ JWT Error:", error.message);
        throw new ApiError(401, "Invalid access token");
    }
});