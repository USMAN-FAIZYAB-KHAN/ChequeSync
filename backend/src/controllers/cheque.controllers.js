import Cheque from '../models/cheque.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { io } from '../index.js';
import users from '../globals/global.js'


// Create a new cheque
export const createCheque = asyncHandler(async (req, res) => {
    const { memberId, month, image } = req.body;

    console.log("ojdp");
    
    if([memberId].some((field) => field?.trim() === "")) {
        throw new ApiError(400, 'All fields are required');
    }

    const chequeExist = await Cheque.findOne({ memberId, month });

    // if(chequeExist) {
    //     throw new ApiError(409, 'Cheque already exists');
    // }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64'); 

    const cheque = await Cheque.create({
        memberId,
        month,
        image: buffer,
        status: 'posted'
    });
    

    console.log(cheque);


    if (!cheque) {
        throw new ApiError(500, 'Something went wrong while creating Cheque');
    }

    const newAccessToken = req.token? req.token : null;

    return res.status(201).json(
        new ApiResponse(201, { cheque, token: newAccessToken }, 'Cheque Created Successfully')
    );
});

// Get all cheques
export const getAllCheques = asyncHandler(async (req, res) => {
    const cheques = await Cheque.find().populate('memberId'); // Populate memberId if needed
    return new ApiResponse(200, cheques);
});

export const getChequesByUserId = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    // Check if memberId is provided
    if (!memberId?.trim()) {
        throw new ApiError(400, "Member ID is required");
    }

    // Fetch cheques for the given member ID
    const cheques = await Cheque.find({ memberId })
        .populate('memberId') // Include member details if necessary
        .lean(); // Convert Mongoose documents to plain JavaScript objects

    if (!cheques || cheques.length === 0) {
        throw new ApiError(404, "No cheques found for this member");
    }

    // Convert binary images to base64
    const chequesWithImages = cheques.map(cheque => ({
        ...cheque,
        image: cheque.image
            ? `data:image/jpeg;base64,${cheque.image.buffer.toString('base64')}`
            : null, // Handle cases where image might be null
    }));

    return res.status(200).json(
        new ApiResponse(200, chequesWithImages, "Cheques retrieved successfully")
    );
});


// Get a cheque by ID
// export const getChequeById = asyncHandler(async (req, res) => {
//     const { memberId } = req.params;
//     const cheque = await Cheque.findById(id).populate('memberId'); // Populate memberId if needed
//     if (!cheque) {
//         throw new ApiError(404, 'Cheque not found');
//     }
//     return new ApiResponse(200, cheque);
// });

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
