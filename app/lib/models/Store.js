import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: { type: String, default: "" },
  contact: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  receiptFooter: { type: String, default: "Thank you for shopping with us." },
  currencySymbol: { type: String, default: "PKR" },
  taxEnabled: { type: Boolean, default: false },
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
