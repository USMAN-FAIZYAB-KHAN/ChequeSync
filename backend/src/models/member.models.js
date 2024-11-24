import mongoose from 'mongoose';
import User from './user.models.js'
const Schema = mongoose.Schema;

const memberSchema = new Schema({
    userId : { type: Schema.Types.ObjectId, ref: 'User', required: true },
    designation: { type: String, required: true },
    joiningDate: { type: Date, required: true },
});

export default mongoose.model('Member', memberSchema);
