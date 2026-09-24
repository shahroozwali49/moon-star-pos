import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema({
  saleNumber: { type: String, required: true, unique: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tillNumber: { type: String, default: "1", trim: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
  lines: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  }],
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["CASH", "CARD", "OTHER"], required: true },
  tenderedAmount: { type: Number, default: 0, min: 0 },
  changeAmount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
