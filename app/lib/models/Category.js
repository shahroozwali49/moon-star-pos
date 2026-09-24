import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  name: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

CategorySchema.index({ storeId: 1, name: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
