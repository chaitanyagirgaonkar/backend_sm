import mongoose, { Schema } from "mongoose";

const pdfSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    semester: {
        type: Number,
        required: true
    },
    subject: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    uploadBy: {
        type: String,
        required: true
    },
    pdfFile: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },

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

    }

}, { timestamps: true })

export const Pdf = mongoose.model("Pdf", pdfSchema)