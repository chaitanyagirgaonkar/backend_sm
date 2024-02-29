import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { sendOTP } from '../utils/emailService.js';
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
        2
        throw new ApiError(400, "All fields are required!");
    }
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email address");
    }

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
        return res.status(400).json(new ApiResponse(400, {}, "entered otp is in valid"))
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
        throw new ApiError(400, "Invalid email address");
    }
    const existedEmail = await Otp.findOne({
        email: email
    })

    await Otp.findByIdAndDelete(existedEmail?._id)

    const sendOtp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

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
        throw new ApiError(400, "user does not exist.")
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

})

export { registerUser, sendOtp, loginUser };
