import mongoose from "mongoose";

const domainPriceSchema = new mongoose.Schema(
  {
    extension: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    registerPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    renewalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    transferPrice: {
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

const DomainPrice = mongoose.model("DomainPrice", domainPriceSchema);

export default DomainPrice;
