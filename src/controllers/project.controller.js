import { Project } from "../models/project.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose, { isValidObjectId } from 'mongoose'
import { uploadOnCloudinary, deleteOnCloudinary, uploadCoverImageOnCloudinary } from '../utils/cloudinary.js'
import { User } from "../models/user.model.js"

const isUserOwner = async (projectId, req) => {
    const project = await Project.findById(projectId);

    if (project?.owner?.toString() !== req.user?._id.toString()) {
        return false;
    }

    return true;

}

const getAllProject = asyncHandler(async (resq, res) => {


    const projects = await Project.find()

    if (!projects || projects.length === 0) {
        throw new ApiError(400, "failed to fetch projects")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "project fetched successfully !!"))
})

const createProject = asyncHandler(async (req, res) => {
    const { title, description, projectUrl, githubUrl, language } = req.body

    if (!title || !description || !projectUrl || !githubUrl || !language) {
        throw new ApiError(400, "All fields are required..!")
    }

    const coverImageLocalPath = req?.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(405, "coverImage file is required")
    }

    const coverImage = await uploadCoverImageOnCloudinary(coverImageLocalPath)


    if (!coverImage) {
        throw new ApiError(407, "failed to upload coverImage on cloudinary")
    }

    const uploadBy = await User.findById(req?.user?._id)

    if (!uploadBy) {
        throw new ApiError(402, "project owner not found")
    }

    console.log(`owner : ${uploadBy.username}`)

    const project = await Project.create({
        title,
        description,
        projectUrl,
        githubUrl,
        language,
        owner: req?.user?._id,
        uploadBy: uploadBy.username,
        coverImage: {
            public_id: coverImage?.public_id,
            url: coverImage?.url,
        }
    })

    if (!project) {
        throw new ApiError(408, "failed to create project")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "project created successfully"))
})

const updateProject = asyncHandler(async (req, res) => {

    const { projectId } = req.params

    if (!isValidObjectId(projectId)) {
        throw new ApiError(404, "In valid projectId !")
    }

    const { title, description, projectUrl, githubUrl, language } = req.body

    if (!title || !description || !projectUrl || !githubUrl || !language) {
        throw new ApiError(400, "All fields are required..!")
    }

    const coverImageLocalPath = req?.file?.path


    const authorized = await isUserOwner(projectId, req)

    if (!authorized) {
        throw new ApiError(300, "Unauthorized Access")
    }

    const previousProject = await Project.findOne(
        {
            _id: projectId
        }
    )

    if (!previousProject) {
        throw new ApiError(404, 'previous project not found')
    }

    let coverImage;
    if (coverImageLocalPath) {
        await deleteOnCloudinary(previousProject?.coverImage?.public_id)

        coverImage = await uploadCoverImageOnCloudinary(coverImageLocalPath)

        if (!coverImage) {
            throw new ApiError(404, "coverImage is not upload on cloudinary")
        }
    }
    if (!coverImageLocalPath) {
        const project = await Project.findByIdAndUpdate(projectId,
            {
                $set: {
                    title,
                    description,
                    projectUrl,
                    githubUrl,
                    language
                }
            }, { new: true })

        if (!project) {
            throw new ApiError(400, "failed to update poject")
        }
        return res.status(200)
            .json(new ApiResponse(200, project, "project updated successfully."))
    } else {
        const project = await Project.findByIdAndUpdate(projectId,
            {
                $set: {
                    title,
                    description,
                    projectUrl,
                    githubUrl,
                    language,
                    coverImage: {
                        public_id: coverImage?.public_id,
                        url: coverImage?.url
                    }
                }
            }, { new: true })
        if (!project) {
            throw new ApiError(400, "failed to update project")
        }
        return res.status(200)
            .json(new ApiResponse(200, project, "pdf updated successfully."))
    }
})

const deleteProject = asyncHandler(async (req, res) => {

    const { projectId } = req.params

    if (!isValidObjectId(projectId)) {
        throw new ApiError(404, "In valid projectId !")
    }

    const authorized = await isUserOwner(projectId, req)

    if (!authorized) {
        throw new ApiError(404, "unAuthorize user")
    }

    const previousProject = await Project.findOne({
        _id: projectId
    })

    if (!previousProject) {
        throw new ApiError(401, "previous project not found")
    }
    if (previousProject) {
        const coverImageDelete = await deleteOnCloudinary(previousProject?.coverImage?.public_id)

        if (!coverImageDelete) {
            throw new ApiError(403, "failed to delete coverImage")
        }
    }

    const project = await Project.findByIdAndDelete(projectId)
    if (!project) {
        throw new ApiError(405, "failed to delete project")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "project file deleted successfully"))

})

const getProjectById = asyncHandler(async (req, res) => {

    const { projectId } = req.params

    if (!isValidObjectId(projectId)) {
        throw new ApiError(404, "In valid projectId !")
    }

    const project = await Project.findById(projectId)

    const authorized = isUserOwner(projectId, req)
    if (!authorized) {
        throw new ApiError(404, "unAuthorize user")
    }

    if (!project) {
        throw new ApiError(400, "failed to fetch project")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "pdf fetched successfully"))



})

const getUserAllProject = asyncHandler(async (req, res) => {

    const project = await Project.find(
        {
            owner: req?.user?.id
        }
    )

    if (!project) {
        throw new ApiError(404, "failed to find user project's")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "All project fetched successfully."))

})

export {
    createProject, updateProject, deleteProject, getProjectById, getUserAllProject, getAllProject
}