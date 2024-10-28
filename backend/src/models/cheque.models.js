import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const statusTypes = ['submitted', 'delivered', 'approved', 'rejected'];

const chequeSchema = new Schema({
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true },
    image: { type: Buffer, required: true },
    processedOn: { type: Date, default: null },
    deliveryDate: { type: Date, default: null },
    status: { type: String, required: true, enum: statusTypes },
    month: { type: Number, required: true, min: 1, max: 12 },
}, { timestamps: true });

export default mongoose.model('Cheque', chequeSchema);
