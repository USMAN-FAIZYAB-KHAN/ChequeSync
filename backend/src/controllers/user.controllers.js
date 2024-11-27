import User from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';  // Import Nodemailer
import bcrypt from "bcrypt";

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
    throw new ApiError(
      500,
      "Something went wrong while creating Access and Refresh Token"
    );
  }
};



export const getuserdetail = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId).select("-password"); // Exclude the password field

  return res.status(201).json(new ApiResponse(201, { user }, ""));
});

export const updatepassword = asyncHandler(async (req, res) => {
  const { userId, confirmpswd } = req.body;
  const user = await User.findById(userId);
  user.password = confirmpswd;
  await user.save(); 
  res.status(200).json(new ApiResponse(200, { message: "Success" },''));
});

export const checloldpassword = asyncHandler(async (req, res) => {
  const { userId, oldpswd } = req.body; // Assuming the userId is sent to identify the user
    
  if (!oldpswd || !userId) {
    res.status(400).json({ message: "Old password and user ID are required" });
    return;
  }

  const user = await User.findById(userId);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const passwordMatch = await bcrypt.compare(oldpswd, user.password);
  console.log("bcrypt",passwordMatch)
  if (!passwordMatch) {
    return res.status(400).json(new ApiResponse(400, { message: "Error" },''));
  }

  return res.status(200).json(new ApiResponse(200, { message: "Success" },''));
});

export const registerUser = asyncHandler(async (req, res) => {
  const { userEmail, firstName, lastName, phoneNo } = req.body;
  const password = "password";
  const type = "member";
  if (
    [userEmail, firstName, lastName, phoneNo, password, type].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All Fields Are Required");
  }

  const userExist = await User.findOne({
    userEmail: userEmail.toLowerCase(),
  });

  if (userExist) {
    console.log(`User with this ${userEmail} email already exist`);
    return res
      .status(409)
      .json(
        new ApiResponse(
          409,
          {},
          `User with this ${userEmail} email already exist`
        )
      );
  }

  const user = await User.create({
    userEmail: userEmail.toLowerCase(),
    firstName,
    lastName,
    phoneNo,
    password,
    type,
  });

  // Fetch the created user excluding password and refreshToken fields
  const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createUser) {
    return res.status(409).json({
      success: false,
      message: "wrong",
    });
  }
  // createUser=null;

  console.log(createUser);

  // Respond with success
  return res
    .status(201)
    .json(new ApiResponse(201, createUser, "User Created Successfully"));
});

// Login a user
export const loginUser = asyncHandler(async (req, res) => {
  const { userEmail, password } = req.body;
  console.log("in login backend");
  console.log(userEmail, password);
  if (!userEmail) {
    throw new ApiError(400, "userEmail is required");
  }

  const user = await User.findOne({
    userEmail: userEmail.toLowerCase(),
  });

  if (!user) {
    return res.status(409).json({
      success: false,
      message: "not_exists",
    });
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    return res.status(409).json({
      success: false,
      message: "inv_cred",
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  
  loggedInUser.refreshToken = refreshToken

  console.log("logged In user",loggedInUser);
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
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

export const automaticSignUp = asyncHandler(async (req, res) => {
  const usersDetail = req.body;
  console.log(req.body);
  if (!Array.isArray(usersDetail) || usersDetail.length === 0) {
    throw new ApiError(404, "No user data provided");
  }

  const createdUsers = [];

  for (const userDetail of usersDetail) {
    const userEmail = userDetail["UserEmail"];
    let phone = userDetail["Phone Number"].toString();
    const firstName = userDetail["First Name"];
    const lastName = userDetail["Last Name"];
    const password = "password";
    const type = "member";

    if (!phone.startsWith("0")) {
      phone = "0" + phone;
    }

    if (
      [userEmail, firstName, lastName, phone, password, type].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      userEmail: userEmail.toLowerCase(),
    });
    if (existingUser) {
      console.log(`User with this ${userEmail} email already exist`);
      return res
        .status(409)
        .json(
          new ApiResponse(
            409,
            {},
            `User with this ${userEmail} email already exist`
          )
        );
    }

    // Set up email transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',  // You can use other services like SendGrid, SES, etc.
        auth: {
            user: 'owaisiqbal2021@gmail.com', // Replace with your email
            pass: "", 
        },
    });

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
    const createUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createUser) {
        return res.status(409).json({
            success: false,
            message: "wrong"
        });
    }
    // createUser=null;

    if (createUser.type === 'member') {
        const mailOptions = {
            from: 'owais4500107@22080',  // Sender address
            to: createUser.userEmail,     // Receiver address
            subject: 'Welcome to ChequeSync!', // Subject line
            text: `Hello ${createUser.firstName},\n\n
        Welcome to ChequeSync! We're excited to have you as a member. Your account has been successfully created.\n\n
        Here are your account details:\n
        - **User Email**: ${createUser.userEmail}\n
        - **Password**: ${password} (You can change your password anytime in the application)\n\n
        If you have any questions or need help, feel free to reach out to us.\n\n
        Best Regards,\n
        ChequeSync Team`,  // Plain text body

            html: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            color: #333;
                            line-height: 1.6;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                            border-radius: 10px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background-color: #4CAF50;
                            color: white;
                            text-align: center;
                            padding: 10px;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            margin-top: 20px;
                        }
                        .footer {
                            font-size: 0.9em;
                            margin-top: 30px;
                            text-align: center;
                            color: #777;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Welcome to ChequeSync, ${createUser.firstName}!</h2>
                        </div>
                        <div class="content">
                            <p>We're thrilled to have you on board. Your account has been successfully created.</p>
                            <p><strong>Account Details:</strong></p>
                            <ul>
                                <li><strong>User Email:</strong> ${createUser.userEmail}</li>
                                <li><strong>Password:</strong> ${password} (You can change it anytime in the app)</li>
                            </ul>
                            <p>If you have any questions or need assistance, don't hesitate to reach out to us.</p>
                        </div>
                        <div class="footer">
                            <p>Best Regards,<br>The ChequeSync Team</p>
                            <p><a href="mailto:support@chequesync.com">support@chequesync.com</a></p>
                        </div>
                    </div>
                </body>
            </html>`, // HTML body
        };


        // Send email
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${createUser.userEmail}`);
        } catch (error) {
            console.error(`Failed to send email to ${createUser.userEmail}:`, error);
        }
    }

    console.log(createUser)

    // Respond with success
    return res.status(201).json(
        new ApiResponse(201, createUser, "User Created Successfully")
    );

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

// // Login a user
// export const loginUser = asyncHandler(async (req, res) => {
//     const { userEmail, password } = req.body
//     console.log("in login backend")
//     console.log(userEmail, password)
//     if (!userEmail) {
//         throw new ApiError(400, "userEmail is required")
//     }

//     const user = await User.findOne({
//         userEmail: userEmail.toLowerCase()
//     })

//     if (!user) {
//         return res.status(409).json({
//             success: false,
//             message: "not_exists"
//         });
//     }

//     const isPasswordValid = await user.isPasswordCorrect(password)
//     if (!isPasswordValid) {
//         return res.status(409).json({
//             success: false,
//             message: "inv_cred"
//         });
//     }

//     const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
//     const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
//     console.log(loggedInUser)
//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 { user: loggedInUser, accessToken, refreshToken },
//                 "User Logged In Successfully"
//             )
//         );
// });

// export const logoutUser = asyncHandler(async (req, res) => {
//     await User.findByIdAndUpdate(
//         req.user._id,
//         {
//             $set: {
//                 refreshToken: undefined
//             }
//         },
//         {
//             new: true
//         }
//     )
//     return res
//         .status(200)
//         .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
// })


// export const automaticSignUp = asyncHandler(async (req, res) => {
//     const usersDetail = req.body;
//     console.log(req.body);
//     if (!Array.isArray(usersDetail) || usersDetail.length === 0) {
//         throw new ApiError(404, "No user data provided");
//     }

//     const createdUsers = [];

//     // Set up email transporter
//     const transporter = nodemailer.createTransport({
//         service: 'gmail',  // You can use other services like SendGrid, SES, etc.
//         auth: {
//             user: 'owaisiqbal2021@gmail.com', // Replace with your email
//             pass: "dkay alnh jryv utos",  // Replace with your email password or app-specific password
//         },
//     });

//     for (const userDetail of usersDetail) {
//         const userEmail = userDetail["UserEmail"];
//         let phone = userDetail["Phone Number"].toString();
//         const firstName = userDetail["First Name"];
//         const lastName = userDetail["Last Name"];
//         const password = 'password';
//         const type = 'member';

//         if (!phone.startsWith("0")) {
//             phone = "0" + phone;
//         }

//         if ([userEmail, firstName, lastName, phone, password, type].some((field) => !field || field.trim() === "")) {
//             throw new ApiError(400, "All fields are required");
//         }

//         // Check if user already exists
//         const existingUser = await User.findOne({ userEmail: userEmail.toLowerCase() });
//         if (existingUser) {
//             console.log(`User with this ${userEmail} email already exist`);
//             return res.status(409).json(
//                 new ApiResponse(409, {}, `User with this ${userEmail} email already exist`)
//             );
//         }

//         // Create the user
//         const user = await User.create({
//             userEmail: userEmail.toLowerCase(),
//             firstName,
//             lastName,
//             phoneNo: phone,
//             password,
//             type,
//         });

//         // Fetch the created user excluding password and refreshToken fields
//         const createdUser = await User.findById(user._id).select("-password -refreshToken");

//         if (!createdUser) {
//             throw new ApiError(500, "Error creating user");
//         }

//         // Send an email to the newly created user if they are a 'member'
//         if (createdUser.type === 'member') {
//             const mailOptions = {
//                 from: 'owais4500107@22080',  // Sender address
//                 to: createdUser.userEmail,     // Receiver address
//                 subject: 'Welcome to ChequeSync!', // Subject line
//                 text: `Hello ${createdUser.firstName},\n\n
//             Welcome to ChequeSync! We're excited to have you as a member. Your account has been successfully created.\n\n
//             Here are your account details:\n
//             - **User Email**: ${createdUser.userEmail}\n
//             - **Password**: ${password} (You can change your password anytime in the application)\n\n
//             If you have any questions or need help, feel free to reach out to us.\n\n
//             Best Regards,\n
//             ChequeSync Team`,  // Plain text body
    
//                 html: `
//                 <html>
//                     <head>
//                         <style>
//                             body {
//                                 font-family: Arial, sans-serif;
//                                 color: #333;
//                                 line-height: 1.6;
//                             }
//                             .container {
//                                 max-width: 600px;
//                                 margin: 0 auto;
//                                 padding: 20px;
//                                 background-color: #f9f9f9;
//                                 border-radius: 10px;
//                                 box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
//                             }
//                             .header {
//                                 background-color: #4CAF50;
//                                 color: white;
//                                 text-align: center;
//                                 padding: 10px;
//                                 border-radius: 5px 5px 0 0;
//                             }
//                             .content {
//                                 margin-top: 20px;
//                             }
//                             .footer {
//                                 font-size: 0.9em;
//                                 margin-top: 30px;
//                                 text-align: center;
//                                 color: #777;
//                             }
//                         </style>
//                     </head>
//                     <body>
//                         <div class="container">
//                             <div class="header">
//                                 <h2>Welcome to ChequeSync, ${createdUser.firstName}!</h2>
//                             </div>
//                             <div class="content">
//                                 <p>We're thrilled to have you on board. Your account has been successfully created.</p>
//                                 <p><strong>Account Details:</strong></p>
//                                 <ul>
//                                     <li><strong>User Email:</strong> ${createdUser.userEmail}</li>
//                                     <li><strong>Password:</strong> ${password} (You can change it anytime in the app)</li>
//                                 </ul>
//                                 <p>If you have any questions or need assistance, don't hesitate to reach out to us.</p>
//                             </div>
//                             <div class="footer">
//                                 <p>Best Regards,<br>The ChequeSync Team</p>
//                                 <p><a href="mailto:support@chequesync.com">support@chequesync.com</a></p>
//                             </div>
//                         </div>
//                     </body>
//                 </html>`, // HTML body
//             };

//             // Send email
//             try {
//                 await transporter.sendMail(mailOptions);
//                 console.log(`Email sent to ${createdUser.userEmail}`);
//             } catch (error) {
//                 console.error(`Failed to send email to ${createdUser.userEmail}:`, error);
//             }
//         }

//         createdUsers.push(createdUser);
//     }

//     // Return response after all users are created
//     return res
//         .status(200)
//         .json(new ApiResponse(200, createdUsers, "Users created successfully"));
// });




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
    throw new ApiError(404, "User not found");
  }
  return new ApiResponse(200, user);
});

// Update a user by ID
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }
  return new ApiResponse(200, updatedUser);
});

// Delete a user by ID
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    throw new ApiError(404, "User not found");
  }
  return new ApiResponse(204);
});
