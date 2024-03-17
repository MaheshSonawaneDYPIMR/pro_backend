import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    console.log("User found:", user); // Log the user object
    
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    console.log("Generated Access Token:", accessToken);
    console.log("Generated Refresh Token:", refreshToken);
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false});

    console.log("User after saving refresh token:", user); // Log the user object after saving refresh token
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in generateAccessAndRefereshTokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};


const registerUser = asyncHandler(async (req, res) => {
  //----------register--------------------
  //get user details from frontend
  //validation
  //check if user is already registered
  //check for images and avatar images
  //upload them to cloudinary
  //create user object - create entry in db
  //remove password and refresh token from response
  //check for user creation
  //return response

  const { fullName, email, userName, password } = req.body;
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill all the fields");
  }

  console.log("Request body",req.files)

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  console.log("Avatar file path:", req.files?.avatar[0]?.path); // Log the avatar file path

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  console.log("Cover image file path:", coverImageLocalPath); // Log the cover image file path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log("Uploaded avatar:", avatar); // Log the uploaded avatar URL
  console.log("Uploaded cover image:", coverImage); // Log the uploaded cover image URL

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.create({
    fullName,
    avatar: avatar,
    coverImage: coverImage,
    email,
    userName: userName.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log("Created user:", createdUser); // Log the created user object

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponce(201, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //----------------------------------loginUser--------------------------------
  //get data from req.body
  //username or email
  //find user by username or email
  //check if password is correct
  //if password is correct
  //create access and refresh token
  //send cookies
  const { email, username, password } = req.body;
  console.log("Login credentials:", email, username, password);

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({ $or: [{ email }, { userName: username }] });

  console.log("Found user:", user); // Log the found user object

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordcorrect(password);
  
  console.log("Is password valid:", isPasswordValid); // Log if the password is valid

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const tokens = await generateAccessAndRefereshTokens(user._id);

  console.log("Generated tokens:", tokens); // Log the generated tokens

  const accessToken = await tokens.accessToken;
  const refreshToken = await tokens.refreshToken;

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log("Logged in user:", loggedInUser); // Log the logged in user object

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponce(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});


const logoutUser = asyncHandler(async (req, res) => {
  console.log("User ID to logout:", req.user._id); // Log the user ID to logout

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  console.log("Refresh token cleared for user:", req.user._id); // Log that the refresh token is cleared for the user

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponce(200, {}, "User logged out successfully"));
});


const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    console.log("Incoming refresh token:", incomingRefreshToken); // Log the incoming refresh token

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    console.log("Decoded refresh token:", decodedRefreshToken);

    if (!decodedRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or invalid");
    }

    const user = await User.findById(decodedRefreshToken?._id);

    console.log("User found:", user); // Log the found user object

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is used or expired");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    console.log("New access token:", accessToken);
    console.log("New refresh token:", newRefreshToken);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponce(
          200,
          {
            user: user,
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Refresh token refreshed successfully"
        )
      );
  } catch (error) {
    console.error("Error in refreshAccessToken:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Invalid refresh token",
    });
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  console.log("Old password:", oldPassword);
  console.log("New password:", newPassword);
  console.log("body",req.body)

  const user = await User.findById(req.user?._id);
  console.log("Found user:", user); // Log the found user object

  const isPasswordCorrect = user.isPasswordcorrect(oldPassword);
  console.log("Is password correct:", isPasswordCorrect); // Log if the old password is correct

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  console.log("Password changed successfully");

  return res
    .status(200)
    .json(new ApiResponce(200, {}, "Password changed successfully"));
});


const getCurrentUser = asyncHandler(async (req, res) => {
  console.log("Current user:", req.user); // Log the current user object
  return res.status(200).json(
    new ApiResponce(
      200,
      {
        user: req.user,
      },
      "User fetched successfully"
    )
  );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  console.log("Updated details:", { fullName, email }); // Log the updated details

  if (!fullName || !email) {
    throw new ApiError(400, "Please fill all the fields");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  console.log("Updated user:", user); // Log the updated user object

  return res
    .status(200)
    .json(new ApiResponce(200, user, "User updated successfully"));
});


const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  console.log("Avatar local path:", avatarLocalPath); // Log the avatar local path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  console.log("Uploaded avatar:", avatar); // Log the uploaded avatar object

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  console.log("Updated user:", user); // Log the updated user object

  return res.status(200).json(
    new ApiResponce(
      200,
      {
        user,
      },
      "User updated successfully"
    )
  );
});


const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  console.log("Cover image local path:", coverImageLocalPath); // Log the cover image local path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log("Uploaded cover image:", coverImage); // Log the uploaded cover image object

  if (!coverImage) {
    throw new ApiError(400, "Cover image upload failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  console.log("Updated user:", user); // Log the updated user object

  return res.status(200).json(
    new ApiResponce(
      200,
      {
        user,
      },
      "User updated successfully"
    )
  );
});


const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  console.log("Username:", username); // Log the username

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $in: [req.user?._id, "$subscribers.subscriber"],
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        avatar: 1,
        isSubscribed: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  console.log("Channel:", channel); // Log the channel object

  return res
    .status(200)
    .json(
      new ApiResponce(200, channel[0], "User channel fetched successfully")
    );
});


const getWatchHistory = asyncHandler(async (req, res) => {
  console.log("User ID:", req.user._id); // Log the user ID

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
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
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  console.log("User watch history:", user[0].watchHistory); // Log the user watch history

  return res.status(200).json(
    new ApiResponce(
      200,
      user[0].watchHistory,
      "User watch history fetched successfully"
    )
  );
});




export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
