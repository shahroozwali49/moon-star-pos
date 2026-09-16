import mongoose from 'mongoose';
const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
  address: { type: String, trim: true, maxlength: 300, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model('Store', storeSchema);
