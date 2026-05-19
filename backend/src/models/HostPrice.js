import mongoose from "mongoose";

const hostPriceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    storage: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyPrice1: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyPrice2: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyPrice3: {
      type: Number,
      required: true,
      min: 0,
    },
    visible: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const HostPrice = mongoose.model("HostPrice", hostPriceSchema);

export default HostPrice;
