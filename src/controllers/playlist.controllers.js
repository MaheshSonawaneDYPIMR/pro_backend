import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, discription } = req.body;
  if (!name || !discription) {
    throw new ApiError(400, "title and discription is needed for playlist");
  }
  const owner = req.user?._id;
  console.log("owner is here", owner);
  if (!owner) {
    throw new ApiError(400, "cant find owner");
  }
  const playlist = await Playlist.create({
    name,
    discription,
    owner,
  });
  res
    .status(201)
    .json(new ApiResponce(201, playlist, "Playlist created successfully"));

  //TODO: create playlist
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log("userId is here", userId);
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }
  const userPlaylist = await Playlist.find({ owner: userId });
  console.log("userPlaylist", userPlaylist);
  return res
    .status(200)
    .json(
      new ApiResponce(200, userPlaylist, "User playlists fetched successfully")
    );
  //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  console.log("playlistId is here", playlistId);
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }
  const playlist = await Playlist.findById(playlistId);
  console.log("playlist is  here", playlist);

  return res
    .status(200)
    .json(
      new ApiResponce(200, playlist, "User playlists fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!videoId || !playlistId) {
    throw new ApiError(400, "videoId and playlistId is required");
  }
  const playlist = await Playlist.findById(playlistId);
  console.log("playlist is here", playlist);
  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "video already in playlist");
  }

  playlist.videos.push(videoId);
  console.log("playlist is here after adding", playlist);

  playlist.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(
      new ApiResponce(200, playlist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!videoId ||!playlistId) {
    throw new ApiError(400, "videoId and playlistId is required");
  }

  const playlist = await Playlist.findById(playlistId);
  console.log("playlist is here", playlist);
  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(400, "video is not in the playlist");
  }

  playlist.videos.pop(videoId);
  console.log("playlist is here after removing", playlist);

  playlist.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(
      new ApiResponce(200, playlist, "Video removed from playlist successfully")
    );

});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }
  
  const playlist = await Playlist.findByIdAndDelete(playlistId);

  return res.status(200).json(
    new ApiResponce(200, playlist, "Playlist deleted successfully")
  )

  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, discription } = req.body;
  if (!name ||!discription) {
    throw new ApiError(400, "title and discription is needed for playlist");
  }
  if(!playlistId) {
    throw new ApiError(400, "playlistId is not provided in params");
  }
  const playlist = await Playlist.findById(playlistId);
  console.log("playlist is here", playlist);
  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }
  playlist.name = name;
  playlist.discription = discription;
  playlist.save({ validateBeforeSave: true });
  return res.status(200).json(
    new ApiResponce(200, playlist, "Playlist updated successfully")
  )

  //TODO: update playlist
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
