import { ApiResponce } from "../utils/ApiResponce.js";
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    res.status(200).json(new ApiResponce(200, "Apan ekadam mast hai re baba", "bole to zakaaas"));
})

export {
    healthcheck
    }
    