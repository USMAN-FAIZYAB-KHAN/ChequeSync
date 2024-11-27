import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

import notificationModels from '../models/notification.models.js';
import userModels from '../models/user.models.js';

export const getNotification = asyncHandler(async (req, res) => {
    const {memberType, id} = req.query;


    console.log("MemberType:", memberType, id);


    if (!memberType) {
        return res.status(400).json({ error: 'MemberType is required' });
    }


    let notificationSet = [];


    if (memberType.includes('hequemanager')) {

        const chequemanager = await userModels.find({ type: 'chequeManager' });


        console.log("Chequemanager:", chequemanager);


        if (chequemanager.length > 0) {

            notificationSet = await notificationModels
                .find({ receiverMember: chequemanager[0]._id, isSeen: false })
                .sort({ updatedAt: -1 });
            console.log("Notification Set:", notificationSet);
        } else {

            return res.status(404).json({ error: 'No chequemanager found' });
        }
    }

    if (memberType.includes('member')) {

       

        

            notificationSet = await notificationModels
                .find({ receiverMember: id, isSeen: false })
                .sort({ updatedAt: -1 });
            console.log("Notification Set:", notificationSet);
       
    }


    console.log(":OUT")

    if (notificationSet && notificationSet.length > 0) {
        console.log("in cheque")
        const ids = notificationSet.map(notification => notification._id);
    
        // Use bulk update
        await notificationModels.updateMany(
            { _id: { $in: ids } },
            { $set: { isSeen: true } }
        );
    }


    return res.status(200).json(
        new ApiResponse(
            200,
            { notificationSet },
        )
    );
});
