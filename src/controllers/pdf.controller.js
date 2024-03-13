import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Pdf } from '../models/pdf.model.js'
import { uploadOnCloudinary, deleteOnCloudinary, uploadCoverImageOnCloudinary } from '../utils/cloudinary.js'
import mongoose, { isValidObjectId } from 'mongoose'
import { User } from "../models/user.model.js"

const isUserOwner = async (pdfId, req) => {
    const pdf = await Pdf.findById(pdfId);

    if (pdf?.owner?.toString() !== req.user?._id.toString()) {
        return false;
    }

    return true;

}


const getAllPdf = asyncHandler(async (resq, res) => {


    const pdfs = await Pdf.find()

    if (!pdfs || pdfs.length === 0) {
        throw new ApiError(400, "failed to fetch pdf")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, pdfs, "pdf fetched successfully !!"))
})

const createPdf = asyncHandler(async (req, res) => {
    const { title, description, subject, semester } = req.body

    if (!title) {
        throw new ApiError(400, "title is required")
    }
    if (!description) {
        throw new ApiError(401, "description is required")
    }
    if (!subject) {
        throw new ApiError(402, "Subject is required")
    }
    if (!semester) {
        throw new ApiError(403, "Semester is required")
    }


    const pdfFileLocalPath = req?.files?.pdfFile?.[0]?.path
    const coverImageLocalPath = req?.files?.coverImage?.[0]?.path



    if (!pdfFileLocalPath) {
        throw new ApiError(409, "pdf file is required")
    }
    if (!coverImageLocalPath) {
        throw new ApiError(405, "coverImage file is required")
    }

    const pdfFile = await uploadOnCloudinary(pdfFileLocalPath)
    const coverImage = await uploadCoverImageOnCloudinary(coverImageLocalPath)



    if (!pdfFile) {
        throw new ApiError(406, "failed to upload pdf on cloudinary")
    }
    if (!coverImage) {
        throw new ApiError(407, "failed to upload coverImage on cloudinary")
    }
    const uploadBy = await User.findById(req?.user?._id)

    if (!uploadBy) {
        throw new ApiError(402, "pdf owner not found")
    }
    console.log(`owner : ${uploadBy.username}`)

    const pdf = await Pdf.create({
        title,
        description,
        semester,
        subject,
        owner: req?.user?._id,
        uploadBy: uploadBy.username,
        pdfFile: {
            public_id: pdfFile?.public_id,
            url: pdfFile?.url,
        },
        coverImage: {
            public_id: coverImage?.public_id,
            url: coverImage?.url,
        }
    })

    if (!pdf) {
        throw new ApiError(408, "failed to create pdf")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, pdf, "pdf created successfully"))

})

const updatePdf = asyncHandler(async (req, res) => {
    const { pdfId } = req.params
    const { title, description, semester, subject } = req.body

    if (!isValidObjectId(pdfId)) {
        throw new ApiError(404, "In valid pdf Id !")
    }
    if (!title || !description) {
        throw new ApiError(404, "title and description required !")
    }
    if (!semester || !subject) {
        throw new ApiError(404, "subject and semester required !")
    }

    const coverImageLocalPath = req?.file?.path

    // if (!coverImageLocalPath) {
    //     throw new ApiError(404, "coverImage is required !")
    // }

    const authorized = await isUserOwner(pdfId, req)

    if (!authorized) {
        throw new ApiError(300, "Unauthorized Access")
    }

    const previousPdf = await Pdf.findOne(
        {
            _id: pdfId
        }
    )

    if (!previousPdf) {
        throw new ApiError(404, 'previous pdf not found')
    }

    let coverImage;
    if (coverImageLocalPath) {
        await deleteOnCloudinary(previousPdf?.coverImage?.public_id)

        coverImage = await uploadCoverImageOnCloudinary(coverImageLocalPath)

        if (!coverImage) {
            throw new ApiError(404, "coverImage is not upload on cloudinary")
        }
    }
    if (!coverImageLocalPath) {
        const pdf = await Pdf.findByIdAndUpdate(pdfId,
            {
                $set: {
                    title,
                    description,
                    subject,
                    semester
                }
            }, { new: true })

        if (!pdf) {
            throw new ApiError(400, "failed to update pdf")
        }
        return res.status(200)
            .json(new ApiResponse(200, pdf, "pdf updated successfully."))
    } else {
        const pdf = await Pdf.findByIdAndUpdate(pdfId,
            {
                $set: {
                    title,
                    description,
                    subject,
                    semester,
                    coverImage: {
                        public_id: coverImage?.public_id,
                        url: coverImage?.url
                    }
                }
            }, { new: true })
        if (!pdf) {
            throw new ApiError(400, "failed to update pdf")
        }
        return res.status(200)
            .json(new ApiResponse(200, pdf, "pdf updated successfully."))
    }


})

const deletePdf = asyncHandler(async (req, res) => {
    const { pdfId } = req.params

    if (!isValidObjectId(pdfId)) {
        throw new ApiError(400, "Invalid pdf Id")
    }

    const authorized = await isUserOwner(pdfId, req)
    if (!authorized) {
        throw new ApiError(404, "unAuthorize user")
    }

    const previousPdf = await Pdf.findOne({
        _id: pdfId
    })

    if (!previousPdf) {
        throw new ApiError(401, "previous pdf not found")
    }
    if (previousPdf) {
        const pdfdelete = await deleteOnCloudinary(previousPdf?.pdfFile?.public_id, "raw")
        const coverImageDelete = await deleteOnCloudinary(previousPdf?.coverImage?.public_id)
        if (!pdfdelete) {
            throw new ApiError(402, "failed to delete  pdfFile")
        }
        // console.log(pdfdelete)
        if (!coverImageDelete) {
            throw new ApiError(403, "failed to delete coverImage")
        }
    }

    const pdf = await Pdf.findByIdAndDelete(pdfId)
    if (!pdf) {
        throw new ApiError(405, "failed to delete pdf")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, pdf, "pdf file deleted successfully"))
})

const getPdfById = asyncHandler(async (req, res) => {
    const { pdfId } = req.params

    if (!isValidObjectId(pdfId)) {
        throw new ApiError(400, "Invalid pdf Id")
    }



    const pdf = await Pdf.findById(pdfId)

    const authorized = isUserOwner(pdfId, req)
    if (!authorized) {
        throw new ApiError(404, "unAuthorize user")
    }
    if (!pdf) {
        throw new ApiError(400, "failed to fetch pdf")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, pdf, "pdf fetched successfully"))
})

const getUserAllPdf = asyncHandler(async (req, res) => {

    const pdf = await Pdf.find(
        {
            owner: req?.user?.id
        }
    )

    if (!pdf) {
        throw new ApiError(404, "failed to find user pdf's")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, pdf, "All pdf fetched successfully."))

})

export { createPdf, updatePdf, deletePdf, getPdfById, getAllPdf, getUserAllPdf }