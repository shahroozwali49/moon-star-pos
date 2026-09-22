import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  barcode: { type: String, default: "", trim: true },
  category: { type: String, default: "General", trim: true },
  costPrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  reorderLevel: { type: Number, default: 5, min: 0 },
  stockByStore: [{
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    quantity: { type: Number, default: 0, min: 0 }
  }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Item || mongoose.model("Item", ItemSchema);
