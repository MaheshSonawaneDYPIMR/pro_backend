import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, discription } = req.body;

  if (!title || !discription) {
    throw new ApiError(404, "please provide both a title and description");
  }

  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailPath = req.files?.thumbnail[0].path;

  if (!videoFileLocalPath || !thumbnailPath) {
    throw new ApiError(
      404,
      "please provide both a videoFileLocalPath and thumbnailPath"
    );
  }

  const videoFileData = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnailData = await uploadOnCloudinary(thumbnailPath);

  if (!videoFileData || !thumbnailData) {
    throw new ApiError(400, "Upload failed");
  }

  const video = await Video.create({
    title,
    discription: discription,
    videoFile: videoFileData.url,
    thumbnail: thumbnailData.url,
    owner: req.user?._id,
    duration: videoFileData.duration,
  });

  const createdVideo = await Video.findById(video._id);
  if (!createdVideo) {
    throw new ApiError(400, " something went wrong during video creation");
  }

  res.status(201).json(new ApiResponce(201, createdVideo, "video published"));
});

const getVideoById = asyncHandler(async (req, res) => {
  console.log("requested params", req.params);
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "please provide a videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  res.status(200).json(new ApiResponce(200, video, "video retrieved"));
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  console.log("requested params from update", req.params);
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "please provide a videoId");
  }

  const { title, discription } = req.body;
  const thumbnail = req.file?.path;
  console.log("update", title, discription, thumbnail);

  if (!title && !discription && !thumbnail) {
    throw new ApiError(
      400,
      "please provide atleast one of title, discription or thumbnail"
    );
  }

  if (title) {
    await Video.updateOne({ _id: videoId }, { $set: { title } });
  }
  if (discription) {
    await Video.updateOne({ _id: videoId }, { $set: { discription } });
  }
  if (thumbnail) {
    const thumbnailData = await uploadOnCloudinary(thumbnail);
    if (!thumbnailData) {
      throw new ApiError(400, "thumbnail Upload failed");
    }

    const newThumbnail = thumbnailData.url;
    await Video.updateOne(
      { _id: videoId },
      { $set: { thumbnail: newThumbnail } }
    );
  }

  const updatedVideo = await Video.findById({ _id: videoId });

  res.status(200).json(new ApiResponce(200, updatedVideo, "video updated"));
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  console.log("requested params from delet", req.params);
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "please provide a videoId");
  }

  const isDeleted = await Video.deleteOne({ _id: videoId });

  if (!isDeleted) {
    throw new ApiError(404, "video not found");
  }

  res.status(200).json(new ApiResponce(200, [], "video deleted successfully"));
  //TODO: get video by id
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  console.log("toggle publish status");
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "please provide a videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  video.isPublished = !video.isPublished;
  await video.save({validateBeforeSave: true});

  res.status(200).json(new ApiResponce(200, video, "video published"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
