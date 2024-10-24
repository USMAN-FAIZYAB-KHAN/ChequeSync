import Cheque from '../models/chequeModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Create a new cheque
export const createCheque = asyncHandler(async (req, res) => {
    const cheque = await Cheque.create(req.body);
    return new ApiResponse(201, cheque);
});

// Get all cheques
export const getAllCheques = asyncHandler(async (req, res) => {
    const cheques = await Cheque.find().populate('memberId'); // Populate memberId if needed
    return new ApiResponse(200, cheques);
});

// Get a cheque by ID
export const getChequeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cheque = await Cheque.findById(id).populate('memberId'); // Populate memberId if needed
    if (!cheque) {
        throw new ApiError(404, 'Cheque not found');
    }
    return new ApiResponse(200, cheque);
});

// Update a cheque by ID
export const updateCheque = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedCheque = await Cheque.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedCheque) {
        throw new ApiError(404, 'Cheque not found');
    }
    return new ApiResponse(200, updatedCheque);
});

// Delete a cheque by ID
export const deleteCheque = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedCheque = await Cheque.findByIdAndDelete(id);
    if (!deletedCheque) {
        throw new ApiError(404, 'Cheque not found');
    }
    return new ApiResponse(204);
});
