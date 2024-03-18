import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponce } from "../utils/ApiResponce.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const user = req.user;
  let isSubscribed;
  console.log("channelId is here ", channelId);

  if (!channelId) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const subscriptionDoc = await Subscription.findOne({
    $and: [{ channel: channelId }, { subscriber: user }],
  });
  console.log("subscriptionDoc is here ", subscriptionDoc);

 
  if (subscriptionDoc == null) {
    isSubscribed = true;
    console.log("Adding subscription document");
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });

    return res
      .status(200)
      .json(
        new ApiResponce(
          200,
          { isSubscribed: isSubscribed },
          "Subscription toggled"
        )
      );
  }

  isSubscribed = false;
  console.log("Removing subscription document");
  await Subscription.findByIdAndDelete(subscriptionDoc.id);
  return res
    .status(200)
    .json(
      new ApiResponce(
        200,
        { isSubscribed: isSubscribed },
        "Subscription toggled"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const  channelId  = req.params;
  if (!channelId) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const subscribers = await Subscription.aggregate([
    { $match: { channel: channelId } },
  ]);

  res
    .status(200)
    .json(new ApiResponce(200, subscribers, "subscribers retrieved"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const channelId = req.params;
  if (!channelId) {
    throw new ApiError(400, "Invalid subscriber ID");
  }
  const subscribedChannels = await Subscription.aggregate([
    { $match: { subscriber: channelId } },
  ]);

  res
    .status(200)
    .json(
      new ApiResponce(200, subscribedChannels, "subscribed channels retrieved")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
