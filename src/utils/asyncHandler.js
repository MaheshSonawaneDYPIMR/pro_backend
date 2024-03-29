//using promises

import { request } from "express";

const asyncHandler = (requesthandler) => {
  return (req, res, next) => {
    Promise
    .resolve(requesthandler(req, res, next))
    .catch((err) => next(err));
  };
};

export {asyncHandler}

//using async await

// const asyncHandler = (fn) =>async (req,res,next)=>{
//     try {
//         await fn(req,res,next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
