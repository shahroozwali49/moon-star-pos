import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: "", trim: true },
  email: { type: String, default: "", lowercase: true, trim: true },
  notes: { type: String, default: "", trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

CustomerSchema.index({ storeId: 1, phone: 1 });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
