import User from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';


// Create a new user
export const createUser = asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    return new ApiResponse(201, user);
});


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