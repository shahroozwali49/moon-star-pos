import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['SUPER_ADMIN', 'STORE_ADMIN', 'CASHIER'], default: 'CASHIER', required: true },
  storeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }],
  active: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model('User', userSchema);
