import mongoose from "mongoose";

const packagePriceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    includesHosting: {
      type: Boolean,
      required: true,
      default: true,
    },
    includesDomain: {
      type: Boolean,
      required: true,
      default: true,
    },
    designPages: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyPrice: {
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

const PackagePrice = mongoose.model("PackagePrice", packagePriceSchema);

export default PackagePrice;
