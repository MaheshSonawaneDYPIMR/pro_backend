import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.models.js";
import { ApiResponce } from "../utils/ApiResponce.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "Please provide a videoId");
  }

  // Convert the videoId to ObjectId using mongoose.Types.ObjectId

  // Use aggregation pipeline to fetch comments for the specified videoId
  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $project: {
        // Exclude the _id field from the result
        comment: 1, // Include the content field in the result
        user: 1, // Include the user field in the result
        createdAt: 1, // Include the createdAt field in the result
      },
    },
    { $skip: (page - 1) * limit }, // Skip documents based on pagination
    { $limit: parseInt(limit) }, // Limit the number of documents returned per page
  ]);

  console.log("comments of the video", comments);

  return res
    .status(200)
    .json(new ApiResponce(200, comments, "Comments retrieved"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Please provide a videoId");
  }
  const { comment } = req.body;
  if (!comment) {
    throw new ApiError(400, "Please provide a comment");
  }

  const newComment = new Comment({
    comment: comment,
    video: videoId,
    user: req.user?._id,
  });

  await newComment.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponce(200, newComment, "comment added"));
  // TODO: add a comment to a video
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Please provide a commentId");
  }
  const { comment } = req.body;
  if (!comment) {
    throw new ApiError(400, "Please provide a comment");
  }

  await Comment.updateOne({_id: commentId},{comment: comment})
  return res.status(200).json(new ApiResponce(200, comment, "comment updated"));
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  console.log(commentId)
  if (!commentId) {
    throw new ApiError(400, "Please provide a commentId");
  }

  await Comment.deleteOne({ _id: commentId })

  return res.status(200).json(new ApiResponce(200, {}, "comment deleted"));
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
