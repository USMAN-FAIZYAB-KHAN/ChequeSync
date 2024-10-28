import User from '../models/user.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const generateAccessAndRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        console.log(refreshToken);
        console.log(typeof refreshToken);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating Access and Refresh Token");
    }
};

// Create a new user
export const registerUser = asyncHandler(async (req, res) => {
    const { userName, firstName, lastName, phoneNo, password, type } = req.body;

    // Check if any required field is missing or empty
    if ([userName, firstName, lastName, phoneNo, password, type].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }

    // Check if a user with the same username already exists
    const userExist = await User.findOne({
        userName: userName.toLowerCase(),
    });

    if (userExist) {
        throw new ApiError(409, "User with username already exists");
    }

    // Create the user
    const user = await User.create({
        userName: userName.toLowerCase(),
        firstName,
        lastName,
        phoneNo,
        password,
        type
    });

    // Fetch the created user excluding password and refreshToken fields
    const createUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createUser) {
        throw new ApiError(500, "Something went wrong while creating User");
    }

    // Respond with success
    return res.status(201).json(
        new ApiResponse(201, createUser, "User Created Successfully")
    );
});

// Login a user
export const loginUser = asyncHandler(async (req, res) => {
    const { userName, password } = req.body

    if (!userName) {
        throw new ApiError(400, "Username is required")
    }

    const user = await User.findOne({
        userName: userName.toLowerCase()
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User Logged In Successfully"
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
})



// Get all users
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find();
    return new ApiResponse(200, users);
});


// Get a user by ID
export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    return new ApiResponse(200, user);
});



// Update a user by ID
export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body
        , { new: true });
    if (!updatedUser) {
        throw new ApiError(404, 'User not found');
    }
    return new ApiResponse(200, updatedUser);
});


// Delete a user by ID
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
        throw new ApiError(404, 'User not found');
    }
    return new ApiResponse(204);
});