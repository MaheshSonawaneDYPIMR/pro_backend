import mongoose, { Schema } from "mongoose";


const subscriptionSchema = new mongoose.Schema({
  subscriber: {
    type: Schema.Types.ObjectId,  //one who is subscribing
    ref: "User",
    required: true,
  },
  channel: {
    type: Schema.Types.ObjectId,  //user who has channelne who is subscribing
    ref: "User",
   
  },

},{timestamps: true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
