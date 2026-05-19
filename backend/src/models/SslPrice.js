import mongoose from "mongoose";

const sslPriceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sslType: {
      type: String,
      required: true,
      enum: ["DV", "OV", "EV", "Wildcard"],
      default: "DV",
      index: true,
    },
    validityMonths: {
      type: Number,
      required: true,
      min: 1,
      default: 12,
    },
    warrantyAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
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

const SslPrice = mongoose.model("SslPrice", sslPriceSchema);

export default SslPrice;
