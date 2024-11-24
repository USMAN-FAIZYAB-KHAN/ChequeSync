import Cheque from "../models/cheque.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { io } from "../index.js";
import users from "../globals/global.js";
import userModels from "../models/user.models.js";
import notificationModels from "../models/notification.models.js";

const months = {
    0: "January",
    1: "February",
    2:"March",
    3:"April",
    4:"May",
    5:"June",
    6:"July",
    7:"August",
    8:"September",
    9:"October",
    10:"November",
    11:"December"
}



// Create a new cheque
export const createCheque = asyncHandler(async (req, res) => {
  const { memberId, month, image } = req.body;

  
    

  if ([memberId].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const chequeExist = await Cheque.findOne({ memberId, month });

  // if(chequeExist) {
  //     throw new ApiError(409, 'Cheque already exists');
  // }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const cheque = await Cheque.create({
    memberId,
    month,
    image: buffer,
    status: "posted",
  });

//   console.log(cheque);

  if (!cheque) {
    throw new ApiError(500, "Something went wrong while creating Cheque");
  }

  const chequeManager = await userModels.find({type:'chequeManager'})
  const member = await userModels.find({_id:memberId})

  const msg = `${member[0].userEmail} has posted the check for month ${months[month-1]}`
  const notification = await notificationModels.create({
    receiverMember: chequeManager[0]._id,
    message:msg,
    originator: member[0]._id
  })

  console.log(notification)
 
  if (chequeManager[0]._id) {


    if (users[chequeManager[0]._id]) {
        console.log("in 2")
        io.to(users[chequeManager[0]._id]).emit('receiveNotification', {notification:notification})
    }
  }

//   io.to(users[])

  const newAccessToken = req.token ? req.token : null;

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { cheque, token: newAccessToken },
        "Cheque Created Successfully"
      )
    );
});

//Get All Cheques

export const getAllCheques = asyncHandler(async (req, res) => {
    const cheques = await Cheque.find().populate('memberId');
    console.log(users)
    const formattedCheques = cheques.map((cheque) => {
        const memberName = cheque.memberId.firstName;
        const month = new Date(cheque.createdAt).toLocaleString('default', { month: 'long' });
        const year = new Date(cheque.createdAt).getFullYear();
        const status = cheque.status;
        return {
          id: cheque._id.toString(),  // Ensure to return the _id as a string
          memberName,
          month,
          year,
          status,
        };
      });
      
    return res.status(201).json(new ApiResponse(200, { cheques: formattedCheques }, ""));
})

// Get Posted Cheques
export const getPostedCheques = asyncHandler(async (req, res) => {
    const cheques = await Cheque.find({ status: 'posted' }).populate('memberId');
    const formattedCheques = cheques.map((cheque) => {
      const user = cheque.memberId;   
      const firstName = user ? user.firstName : 'Unknown';
      const lastName = user ? user.lastName : 'User';        
      return {
        _id: cheque._id,
        sender: `${firstName} ${lastName}`,
        image: `data:image/png;base64,${cheque.image.toString("base64")}`, 
        message: user ? `${firstName}’s cheque image for ${new Date().toLocaleString("default", { month: "long" })}.` : 'No Message',
        time: new Date(cheque.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
      };
    });
  
    return res.status(200).json(new ApiResponse(200, { formattedCheques }, ""));
  });
  

// Get all the cheques of user id
export const getChequesByUserId = asyncHandler(async (req, res) => {
//   console.log(req.params);
  const { memberId } = req.params;
  const cheques = await Cheque.find({ memberId: memberId }).populate(
    "memberId"
  ); // Populate memberId if needed
//   console.log("cheques", cheques);
  return res.status(200).json(new ApiResponse(200, cheques, ""));
});


// Update a cheque by ID for receive
export const updatechequestatus = asyncHandler(async(req, res)=>{
    const {messageId, status} = req.body

    const result = await Cheque.updateOne(
      { _id: messageId },
      { $set: { status } }
    );
    res.status(200).json(new ApiResponse(200,{message :"Cheque status updated successfully."}, ''));
})


// Delete a cheque by ID
export const deleteCheque = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedCheque = await Cheque.findByIdAndDelete(id);
  if (!deletedCheque) {
    throw new ApiError(404, "Cheque not found");
  }
  return new ApiResponse(204);
});
