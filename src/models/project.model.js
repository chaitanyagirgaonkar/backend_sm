import mongoose, { Schema } from 'mongoose';

const projectSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        projectUrl: {
            type: String,
            required: true,
        },
        githubUrl: {
            type: String,
            required: true,
        },
        coverImage: {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            },

        },
        language: {
            type: String,
            required: true
        },
        uploadBy: {
            type: String,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    }, { timestamps: true })

export const Project = mongoose.model("Project", projectSchema)