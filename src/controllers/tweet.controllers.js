import mongoose, { isValidObjectId } from "mongoose";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  console.log("content is here", content);
  if (!content) {
    throw new ApiError(400, "Invalid content");
  }
  const owner = req.user?._id;
  console.log("owner is here", owner);
  if (!owner) {
    throw new ApiError(400, "Invalid owner");
  }
  const tweet = await Tweet.create({
    content,
    owner,
  });

  res
    .status(201)
    .json(new ApiResponce(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log("user is here", user);
  if (!user) {
    throw new ApiError(400, "Invalid user");
  }
  const tweets = await User.aggregate([
    {
      $match: {
        _id: user._id,
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "tweets",
      },
    },
    {
      $addFields: {
        totalTweets: {
          $size: "$tweets",
        },
      },
    },
    {
      $project: {
        tweets: 1,
        totalTweets: 1,
      },
    },
  ]);
  if (!tweets) {
    throw new ApiError(400, "check it here 111");
  }

  return res
    .status(200)
    .json(new ApiResponce(200, tweets, "Tweets retrieved successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;
  console.log("tweetId is here", tweetId, content);
  if (!tweetId || !content) {
    throw new ApiError(400, "invalid tweet or content ");
  }

await Tweet.updateOne({ _id: tweetId }, { $set: { content: content } });


  return res
    .status(200)
    .json(new ApiResponce(200, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  console.log("tweetId is here", tweetId);
  if (!tweetId) {
    throw new ApiError(400, "invalid tweetId");
  }

  await Tweet.deleteOne({ _id: tweetId });
  return res.status(200).json(
    new ApiResponce(200, "Tweet deleted successfully")
  )

});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
