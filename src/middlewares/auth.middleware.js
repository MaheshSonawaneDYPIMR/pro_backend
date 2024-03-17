import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, _ , next) => {
 try {
     const token =
       req.cookies?.accessToken ||
       req.header("Authorization")?.replace("Bearer ", "");
   
     console.log("Token:", token); // Log the token for debugging

     if (!token) {
       throw new ApiError(401, "Unauthorized request");
     }

     if (typeof token !== 'string') {
       console.log("Invalid token type:", typeof token);
       throw new ApiError(401, "Invalid token type");
     }
    
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
   
     const user = await User.findById(decodedToken?._id).select(
       "-password -refreshToken"
     );

     console.log("Decoded token:", decodedToken);
     console.log("User:", user); // Log the user object for debugging

     if (!user) {
       throw new ApiError(401, "Invalid access token");
     }
   
     req.user = user;
     next();
 } catch (error) {
    console.error("Error in verifyJwt middleware:", error);
    throw new ApiError(401, error?.message || "Invalid access token");
 }
});
