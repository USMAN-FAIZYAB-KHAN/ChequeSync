import jwt from 'jsonwebtoken';
import User from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const accessToken = req.header("Authorization")?.replace("Bearer ", "");

        const userId = jwt.decode(accessToken)?._id;

        const user = await User.findOne({ _id: userId });
        const refreshToken = user?.refreshToken;
        console.log(refreshToken);

        if (!accessToken) {
            throw new ApiError(401, "Unauthorized request: Access token required");
        }

        // Verify the access token
        try {
            const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

            
            if (!user) {
                console.log("INVALID ACCESS TOKEN");
                throw new ApiError(401, "Invalid Access Token");
            }

            // Attach user to request and proceed
            req.user = user;
            return next();

        } catch (error) {
            console.log(refreshToken);
            console.log(typeof refreshToken);

            // Access token might be expired
            if (error.name === 'TokenExpiredError' && refreshToken) {
                // Attempt to refresh the access token
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                const user = await User.findById(decodedRefreshToken?._id).select("-password -refreshToken");

                if (!user) {
                    throw new ApiError(401, "Invalid Refresh Token");
                }

                console.log("Access token expired. Refreshing token...");

                // Generate a new access token
                const newAccessToken = user.generateAccessToken(); // Assuming you have a method to generate access token
                req.user = user;

                // Respond with the new access token
                req.token = newAccessToken;
                console.log(newAccessToken);
                return next();
            }

            // If token is expired and no refresh token provided, throw an error
            throw new ApiError(401, "Unauthorized request: Access token expired");
        }
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
})
