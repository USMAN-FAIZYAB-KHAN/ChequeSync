import mongoose from 'mongoose';
import User from './user.models.js';

const Schema = mongoose.Schema;


const notificationSchema = new Schema({
    receiverMember: { type: Schema.Types.ObjectId, ref: User, required: true },
    message: {type:String, required: true},
    originator: { type: Schema.Types.ObjectId, ref: User, required: true },
    isSeen: {type: Boolean, default: false}

}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema);