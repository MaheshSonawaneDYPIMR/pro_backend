import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, _ , next) => {
 try {
     const token =
       req.cookies?.accessToken ||
       req.header("Authorization")?.replace("Bearer ", "");
   
       console.log("tokekkk",req.cookies)
     if (!token) {
       throw new ApiError(401, "unauthorised request");
     }

     if (typeof token !== 'string') {
       console.log(token)
      }
    

     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
   
     const user = await User.findById(decodedToken?._id).select(
       "-password -refeshToken"
     );
     if (!user) {
       throw new ApiError(401, "Invalid Access token");
     }
   
     req.user = user;
     next();
 } catch (error) {

    throw new ApiError(401,error?.message || "invalid access token");
    
 }

});
