import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: { type: String, default: "" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Store = mongoose.models.Store || mongoose.model("Store", StoreSchema);

export default Store;
