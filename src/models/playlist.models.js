import mongoose from "mongoose";
import { Schema } from "mongoose";

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
   
  },discription:{
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  videos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
},{timestamps:true});

export const Playlist = mongoose.model("Playlist", playlistSchema);