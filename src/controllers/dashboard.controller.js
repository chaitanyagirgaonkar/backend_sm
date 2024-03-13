import mongoose from "mongoose"
import { Pdf } from "../models/pdf.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getUserState = asyncHandler(async (req, res) => {
    const channelStats = await Pdf.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
                _id: null,
                totalPdf: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalPdf: 1
            }
        }

    ])
    if (!channelStats) {
        throw new ApiError(404, "channel stats not found")
    }
    console.log(channelStats)

    return res.status(200)
        .json(new ApiResponse(200, channelStats, "channel status fetched successfully"))
})

export {
    getUserState
}