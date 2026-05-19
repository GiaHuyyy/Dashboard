import mongoose from "mongoose";

const advertisingPriceSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ["Google", "Facebook", "TikTok", "Zalo"],
      default: "Google",
      index: true,
    },
    packageName: {
      type: String,
      required: true,
      trim: true,
    },
    minimumBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceFeePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    setupFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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

const AdvertisingPrice = mongoose.model("AdvertisingPrice", advertisingPriceSchema);

export default AdvertisingPrice;
