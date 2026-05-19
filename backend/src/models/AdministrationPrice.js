import mongoose from "mongoose";

const administrationPriceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      required: true,
      enum: ["Website", "Hệ thống", "Server"],
      default: "Website",
      index: true,
    },
    frequency: {
      type: String,
      required: true,
      enum: ["Tháng", "Quý", "Năm", "Theo yêu cầu"],
      default: "Tháng",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    slaHours: {
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

const AdministrationPrice = mongoose.model("AdministrationPrice", administrationPriceSchema);

export default AdministrationPrice;
