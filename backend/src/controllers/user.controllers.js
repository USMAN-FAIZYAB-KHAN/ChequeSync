import User from '../models/user.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from "jsonwebtoken";

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
// export const registerUser = asyncHandler(async (req, res) => {
//     const { userName, firstName, lastName, phoneNo, password, type } = req.body;

//     console.log(userName, firstName, lastName, phoneNo, password, type)

//     // Check if any required field is missing or empty
//     if ([userName, firstName, lastName, phoneNo, password, type].some((field) => field?.trim() === "")) {
//         throw new ApiError(400, "All Fields Are Required");
//     }

//     // Check if a user with the same username already exists
//     const userExist = await User.findOne({
//         userName: userName.toLowerCase(),
//     });

//     if (userExist) {
//         throw new ApiError(409, "User with username already exists");
//     }

//     // Create the user
//     const user = await User.create({
//         userName: userName.toLowerCase(),
//         firstName,
//         lastName,
//         phoneNo,
//         password,
//         type
//     });

//     // Fetch the created user excluding password and refreshToken fields
//     const createUser = await User.findById(user._id).select("-password -refreshToken");

//     if (!createUser) {
//         throw new ApiError(500, "Something went wrong while creating User");
//     }
//     // createUser=null;

//     // Respond with success
//     return res.status(201).json(
//         new ApiResponse(201, createUser, "User Created Successfully")
//     );
// });


export const registerUser = asyncHandler(async (req, res) => {
    const { userEmail, firstName, lastName, phoneNo } = req.body;
    const password = 'password'
    const type = 'member'
    console.log(userEmail, firstName, lastName, phoneNo, password, type)

    // Check if any required field is missing or empty
    if ([userEmail, firstName, lastName, phoneNo, password, type].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }

    // Check if a user with the same userEmail already exists
    const userExist = await User.findOne({
        userEmail: userEmail.toLowerCase(),
    });

    if (userExist) {
        console.log(`User with this ${userEmail} email already exist`)
        return res.status(409).json(
            new ApiResponse(409, {}, `User with this ${userEmail} email already exist`)
        );
    }

    // Create the user
    const user = await User.create({
        userEmail: userEmail.toLowerCase(),
        firstName,
        lastName,
        phoneNo,
        password,
        type
    });

    // Fetch the created user excluding password and refreshToken fields
    const createUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createUser) {
        return res.status(409).json({
            success: false,
            message: "wrong"
        });
    }
    // createUser=null;

    console.log(createUser)

    // Respond with success
    return res.status(201).json(
        new ApiResponse(201, createUser, "User Created Successfully")
    );

});

// Login a user
export const loginUser = asyncHandler(async (req, res) => {
    const { userEmail, password } = req.body
    console.log("in login backend")
    console.log(userEmail, password)
    if (!userEmail) {
        throw new ApiError(400, "userEmail is required")
    }

    const user = await User.findOne({
        userEmail: userEmail.toLowerCase()
    })

    if (!user) {
        return res.status(409).json({
            success: false,
            message: "not_exists"
        });
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        return res.status(409).json({
            success: false,
            message: "inv_cred"
        });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    console.log(loggedInUser)
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


export const automaticSignUp = asyncHandler(async (req, res) => {
    const usersDetail = req.body;
    console.log(req.body)
    if (!Array.isArray(usersDetail) || usersDetail.length === 0) {
        throw new ApiError(404, "No user data provided");
    }

    const createdUsers = [];

    for (const userDetail of usersDetail) {
        const userEmail = userDetail["UserEmail"];
        let phone = userDetail["Phone Number"].toString();
        const firstName = userDetail["First Name"];
        const lastName = userDetail["Last Name"];
        const password = 'password';
        const type = 'member';


        if (!phone.startsWith("0")) {
            phone = "0" + phone;
        }

        if ([userEmail, firstName, lastName, phone, password, type].some((field) => !field || field.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        // Check if user already exists
        const existingUser = await User.findOne({ userEmail: userEmail.toLowerCase() });
        if (existingUser) {
            console.log(`User with this ${userEmail} email already exist`)
            return res.status(409).json(
                new ApiResponse(409, {}, `User with this ${userEmail} email already exist`)
            );
        }

        // Create the user
        const user = await User.create({
            userEmail: userEmail.toLowerCase(),
            firstName,
            lastName,
            phoneNo: phone,
            password,
            type,
        });

        // Fetch the created user excluding password and refreshToken fields
        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new ApiError(500, "Error creating user");
        }

        createdUsers.push(createdUser);
    }



    // Return response after all users are created
    return res
        .status(200)
        .json(new ApiResponse(200, createdUsers, "Users created successfully"));
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