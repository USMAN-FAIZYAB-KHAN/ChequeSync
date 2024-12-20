import Cheque from "../models/cheque.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { io } from "../index.js";
import users from "../globals/global.js";
import { getMonthName } from "../globals/global.js";
import userModels from "../models/user.models.js";
import notificationModels from "../models/notification.models.js";

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

  console.log(base64Data);

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

  const chequeManager = await userModels.find({ type: "chequeManager" });
  const member = await userModels.find({ _id: memberId });

  const msg = `${member[0].userEmail} has posted the check for month ${getMonthName(month)}`;
  const notification = await notificationModels.create({
    receiverMember: chequeManager[0]._id,
    message: msg,
    originator: member[0]._id,
  });

  console.log(notification);

  if (chequeManager[0]._id) {
    if (users[chequeManager[0]._id]) {
      console.log("in 2", chequeManager, users);
      io.to(users[chequeManager[0]._id]).emit("receiveNotification", {
        notification: notification,
      });
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
  const { year, month } = req.query;
  const monthDict = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  const monthNumber = monthDict[month];
  const cheques = await Cheque.find({ month: monthNumber }).populate(
    "memberId"
  );
  console.log(cheques[0].month);
  const filteredCheques = cheques.filter((item) => {
    const chequeyear = new Date(item.updatedAt).getFullYear();
    return chequeyear === parseInt(year);
  });

  const formattedCheques = filteredCheques.map((cheque) => ({
    id: cheque._id.toString(),
    memberName: cheque.memberId?.firstName || "Unknown Member",
    month: cheque.month,
    year,
    status: cheque.status,
  }));
  console.log(formattedCheques[0], formattedCheques.length);
  return res
    .status(200)
    .json(new ApiResponse(200, { cheques: formattedCheques }, ""));
});

// Get Posted Cheques
export const getPostedCheques = asyncHandler(async (req, res) => {
  const cheques = await Cheque.find({ status: "posted" }).populate("memberId");
  const formattedCheques = cheques.map((cheque) => {
    const user = cheque.memberId;
    const firstName = user ? user.firstName : "Unknown";
    const lastName = user ? user.lastName : "User";
    return {
      _id: cheque._id,
      sender: `${firstName} ${lastName}`,
      image: `data:image/png;base64,${cheque.image.toString("base64")}`,
      message: user
        ? `${firstName}’s cheque image for ${getMonthName(cheque.month)}.`
        : "No Message",
      time: new Date(cheque.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });

  return res.status(200).json(new ApiResponse(200, { formattedCheques }, ""));
});

// Get Posted Cheques
export const getReceivedCheques = asyncHandler(async (req, res) => {
  const cheques = await Cheque.find({ status: "received" }).populate(
    "memberId"
  );
  const formattedCheques = cheques.map((cheque) => {
    const user = cheque.memberId;
    const firstName = user ? user.firstName : "Unknown";
    const lastName = user ? user.lastName : "User";
    return {
      _id: cheque._id,
      sender: `${firstName} ${lastName}`,
      image: `data:image/png;base64,${cheque.image.toString("base64")}`,
      message: user
        ? `${firstName}’s cheque image for ${getMonthName(cheque.month)}.`
        : "No Message",
      time: new Date(cheque.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });

  return res.status(200).json(new ApiResponse(200, { formattedCheques }, ""));
});

export const getChequesByUserId = asyncHandler(async (req, res) => {
  //   console.log(req.params);
  const { memberId } = req.params;
  const cheques = await Cheque.find({ memberId: memberId }).populate(
    "memberId"
  );
  const formattedCheques = cheques.map((cheque) => {
    const memberName = cheque.memberId.firstName;
    const month = cheque.month;
    const year = new Date(cheque.createdAt).getFullYear();
    const image = `data:image/png;base64,${cheque.image.toString("base64")}`;
    const status = cheque.status;
    return {
      id: cheque._id.toString(),
      memberName,
      month,
      year,
      status,
      image,
    };
  });

  return res.status(201).json(new ApiResponse(200, formattedCheques, ""));
});

// Update a cheque by ID for receive
export const updatechequestatus = asyncHandler(async (req, res) => {
  let { messageId, status, message, image, Role } = req.body;
  console.log("In ssss", Role)
  let buffer;
  if (image) {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    console.log("base64", base64Data);
    buffer = Buffer.from(base64Data, "base64");
  }

  let result;

  if (message && image) {
    console.log("qwjedqwojdoqwdmqwjeido nwedi")
    image = buffer
    result = await Cheque.updateOne(
      { _id: messageId },
      { $set: { status, image } }
    );
    console.log(result)
  } else {
    result = await Cheque.updateOne({ _id: messageId }, { $set: { status } });
  }

  console.log("In ssss")

  if (Role && Role.toLowerCase() == "chequemanager") {

    const chequeManager = await userModels.find({ type: "chequeManager" })
    const memberCheque = await Cheque.findById(messageId);
    console.log(memberCheque)
    const member = await userModels.findById(memberCheque.memberId);
    console.log(member, memberCheque._id)

    const msg = `Cheque Manager has ${status} the check for month ${getMonthName(memberCheque.month)}`;
    const notification = await notificationModels.create({
      receiverMember: member._id,
      message: msg,
      originator: chequeManager[0]._id,
    });
    console.log("i1")
    io.to(users[member._id]).emit("receiveNotification", {
      notification: notification,
    });
    console.log("i2")

  }

  else if (Role && Role.toLowerCase() == "branchmanager") {

    const branchManager = await userModels.find({ type: "branchManager" })
    const chequeManager = await userModels.find({ type: "chequeManager" })
    const memberCheque = await Cheque.findById(messageId);
    console.log(memberCheque)
    const member = await userModels.findById(memberCheque.memberId);
    console.log(member, memberCheque._id, chequeManager)

    const msg = `branch Manager has ${status} the check of ${member.firstName + " " + member.lastName} for month ${getMonthName(memberCheque.month)}`;

    console.log("i1")
    for (const user of [chequeManager[0], member]) {
      try {
        // Create notification
        const notification = await notificationModels.create({
          receiverMember: user._id,
          message: msg,
          originator: branchManager[0]._id,
        });

        // Emit notification if user is connected
        if (users[user._id]) {
          io.to(users[user._id]).emit("receiveNotification", {
            notification: notification,
          });
        } else {
          console.warn(`User with ID ${user._id} is not connected.`);
        }
      } catch (error) {
        console.error(`Error processing notification for user ${user._id}:`, error.message);
      }
    }

    console.log("i2")
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { message: "Cheque status updated successfully." },
        ""
      )
    );
});

// Delete a cheque by ID
export const deleteCheque = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedCheque = await Cheque.findByIdAndDelete(id);
  if (!deletedCheque) {
    throw new ApiError(404, "Cheque not found");
  }
  return new ApiResponse(204);
});
