import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { sendOTP } from '../utils/emailService.js';
import jwt from "jsonwebtoken"
import { Otp } from '../models/otp.model.js'


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generaterAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, collegeName, otp } = req.body;


    if ([username, password, email, collegeName].some((field) => field?.trim() === "")) {

        throw new ApiError(400, "All fields are required!");
    }
    // if (!emailRegex.test(email)) {
    //     throw new ApiError(400, "Invalid email address");
    // }

    if (!otp) {
        throw new ApiError(404, "otp is required")
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const saveOtp = await Otp.findOne({
        email: email
    })
    // console.log(saveOtp)

    if (saveOtp?.otp !== otp) {
        return res.status(405).json(new ApiResponse(402, {}, "entered otp is in valid"))
    }


    const user = await User.create({
        username,
        email,
        password,
        collegeName,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(200).json(new ApiResponse(200, createdUser, "User Created Successfully!"));
});

const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        throw new ApiError(400, "Email is required !")
    }
    if (!emailRegex.test(email)) {
        throw new ApiError(401, "Invalid email address");
    }
    const existedRegisteredEmail = await User.findOne({
        email: email
    })
    if (existedRegisteredEmail) {
        throw new ApiError(409, "User with email exists");
    }

    const existedEmail = await Otp.findOne({
        email: email
    })

    await Otp.findByIdAndDelete(existedEmail?._id)

    const sendOtp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP

    const saveOtp = await Otp.create({
        email,
        otp: sendOtp
    })

    if (!saveOtp) {
        throw new ApiError(404, "Failed to Save OTP into Database ")
    }

    try {
        await sendOTP(email, sendOtp);
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw new ApiError(500, "Failed to send OTP");
    }

    res.status(200)
        .json(new ApiResponse(200, {}, "otp sent successfully !"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body

    if (!username) {
        throw new ApiError(400, "username is required.")
    }

    if (!password) {
        throw new ApiError(400, "password is required.")
    }

    const user = await User.findOne(
        {
            username: username
        }
    )
    if (!user) {
        throw new ApiError(401, "user does not exist.")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "Invalid User Credentials.")
    }

    const { accessToken, refreshToken } = await generaterAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In successfully !"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req?.user?._id,
        {
            $unset: {
                refreshToken: 1
            }
        }, { new: true })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out successfully !"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req?.cookies?.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    // console.log(`incomingRefreshToken : ${incomingRefreshToken}`)
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        // console.log(`decodedToken : ${decodedToken}`)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generaterAccessAndRefreshToken(user._id)
        // console.log(`accesstoken  = ${accessToken} and refreshtoken : ${newRefreshToken}`)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: refreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req?.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password !")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password change successfully !"))
})

const getCurrentUser = asyncHandler(async (req, res) => {

    const user = req?.user
    if (!user) {
        throw new ApiError(401, "user not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, user, "user fetched successfully !"))
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { collegeName } = req.body



    if (!collegeName) {
        throw new ApiError(400, "college name is required.")
    }



    const user = await User.findByIdAndUpdate(req?.user?._id,
        {
            $set: {
                collegeName,
            }
        }, { new: true }).select("-password")
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account detail update successfully !"))
})


export { registerUser, sendOtp, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUserDetails };
