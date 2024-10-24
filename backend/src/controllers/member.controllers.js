import Member from '../models/memberModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Create a new member
export const createMember = asyncHandler(async (req, res) => {
    const member = await Member.create(req.body);
    return new ApiResponse(201, member);
});

// Get all members
export const getAllMembers = asyncHandler(async (req, res) => {
    const members = await Member.find().populate('userId'); // Populate userId if needed
    return new ApiResponse(200, members);
});

// Get a member by ID
export const getMemberById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const member = await Member.findById(id).populate('userId'); // Populate userId if needed
    if (!member) {
        throw new ApiError(404, 'Member not found');
    }
    return new ApiResponse(200, member);
});

// Update a member by ID
export const updateMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedMember = await Member.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedMember) {
        throw new ApiError(404, 'Member not found');
    }
    return new ApiResponse(200, updatedMember);
});

// Delete a member by ID
export const deleteMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedMember = await Member.findByIdAndDelete(id);
    if (!deletedMember) {
        throw new ApiError(404, 'Member not found');
    }
    return new ApiResponse(204);
});
