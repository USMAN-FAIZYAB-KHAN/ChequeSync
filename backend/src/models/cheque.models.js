import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const statusTypes = ['submitted', 'delivered', 'approved', 'rejected'];

const chequeSchema = new Schema({
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    image: { type: Buffer, required: true },
    submissionDate: { type: Date, required: true },
    processedOn: { type: Date },
    deliveryDate: { type: Date },
    status: { type: String, required: true, enum: statusTypes },
    month: { type: String, required: true },
});

export default mongoose.model('Cheque', chequeSchema);
