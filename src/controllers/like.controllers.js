import mongoose, { isValidObjectId } from "mongoose";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.models.js";
import { ApiResponce } from "../utils/ApiResponce.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user;
  let result;

  if (!mongoose.isValidObjectId(videoId)) {
    console.log("Invalid videoId format"); // Checkpoint
    return res
      .status(400)
      .json(new ApiResponce(400, null, "Invalid videoId format"));
  }
  const isVideoLiked = await Like.findOne({
    $and: [{ video: videoId }, { likedBy: user._id }],
  });

  console.log("isVideoLiked: ", isVideoLiked);

  if (isVideoLiked) {
    await Like.findByIdAndDelete(isVideoLiked._id);

    result = false;
  } else {
    result = true;
    await Like.create({ video: videoId, likedBy: user._id });
  }

  return res
    .status(200)
    .json(new ApiResponce(200, result, "video like toggled"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = req.user;
  let result;

  if (!mongoose.isValidObjectId(commentId)) {
    console.log("Invalid commentId format"); // Checkpoint
    return res
      .status(400)
      .json(new ApiResponce(400, null, "Invalid commentId format"));
  }

  const isCommentLiked = await Like.findOne({
    $and: [{ comment: commentId }, { likedBy: user._id }],
  });

  console.log("isCommentLiked: ", isCommentLiked);

  if (isCommentLiked) {
    await Like.findByIdAndDelete(isCommentLiked._id);
    result = false;
  } else {
    result = true;
    await Like.create({ comment: commentId, likedBy: user._id });
  }

  return res
    .status(200)
    .json(new ApiResponce(200, result, "comment like toggled"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  const { tweetId } = req.params;
  const user = req.user;
  let result;
  
  if (!mongoose.isValidObjectId(tweetId)) {
    console.log("Invalid tweetId format"); // Checkpoint
    return res
      .status(400)
      .json(new ApiResponce(400, null, "Invalid tweetId format"));
  }
  
  const isTweetLiked = await Like.findOne({
    $and: [{ tweet: tweetId }, { likedBy: user._id }],
  });

  console.log("isTweetLiked: ", isTweetLiked);

  if (isTweetLiked) {
    await Like.findByIdAndDelete(isTweetLiked._id);
    result = false;
  } else {
    result = true;
    await Like.create({ tweet: tweetId, likedBy: user._id });
  }

  return res
   .status(200)
   .json(new ApiResponce(200, result, "tweet like toggled"));

});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const user = req.user
  if(!user){
    throw new ApiError(400, "User is not logged in");
  }
  const likedVideos = await Like.aggregate([
    {
      $match:{
        likedBy: user._id,
        video: { $exists: true }
      }
    },{
      $lookup:{
        from:"videos",
        localField:"video",
        foreignField:"_id",
        as:"video"
      }
    },{
      $project:{
        video:{
          title:1,
          description:1,
          thumbnail:1,
          duration:1,
          views:1,
          likes:1,
          publishBy:1,
          createdAt:1,
          owner:1
        }

      }
    }])
    console.log("Liked videos: ", likedVideos);

    return res
    .status(200)
    .json(new ApiResponce(200, likedVideos, "liked videos"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
