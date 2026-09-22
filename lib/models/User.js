import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "STORE_ADMIN", "CASHIER"],
      default: "CASHIER"
    },
    storeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
