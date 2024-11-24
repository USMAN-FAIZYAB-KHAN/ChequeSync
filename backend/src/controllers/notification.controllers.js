import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

import notificationModels from '../models/notification.models.js';
import userModels from '../models/user.models.js';

export const getNotification = asyncHandler(async (req, res) => {
    const memberType = req.query.memberType;


    console.log("MemberType:", memberType);


    if (!memberType) {
        return res.status(400).json({ error: 'MemberType is required' });
    }


    let notificationSet = [];


    if (memberType.includes('hequemanager')) {

        const chequemanager = await userModels.find({ type: 'chequeManager' });


        console.log("Chequemanager:", chequemanager);


        if (chequemanager.length > 0) {

            notificationSet = await notificationModels
                .find({ receiverMember: chequemanager[0]._id })
                .sort({ updatedAt: -1 });
            console.log("Notification Set:", notificationSet);
        } else {

            return res.status(404).json({ error: 'No chequemanager found' });
        }
    }
    console.log(":OUT")


    return res.status(200).json(
        new ApiResponse(
            200,
            { notificationSet },
        )
    );
});
