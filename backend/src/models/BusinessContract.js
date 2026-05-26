import mongoose from "mongoose";

const businessContractImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      required: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const businessContractSchema = new mongoose.Schema(
  {
    contractCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contractName: {
      type: String,
      required: true,
      trim: true,
    },
    contractValue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    status: {
      type: String,
      required: true,
      enum: ["Đã nhận", "Đang xử lý", "Hoàn thành"],
      default: "Đã nhận",
    },
    mailStatus: {
      type: String,
      required: true,
      enum: ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"],
      default: "Mail nhận",
    },
    selectedSalesStaff: {
      type: String,
      required: true,
      trim: true,
    },
    salesReceiverName: {
      type: String,
      required: true,
      trim: true,
    },
    salesReceiverEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    ccEmails: {
      type: [String],
      default: [],
    },
    contractImages: {
      type: [businessContractImageSchema],
      default: [],
    },
    handoverStatus: {
      type: String,
      required: true,
      enum: ["Chưa bàn giao", "Đã bàn giao"],
      default: "Chưa bàn giao",
      index: true,
    },
    expectedHandoverAt: {
      type: Date,
      default: null,
      index: true,
    },
    handoverAt: {
      type: Date,
      default: null,
    },
    visible: {
      type: Boolean,
      required: true,
      default: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      required: true,
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

const BusinessContract = mongoose.model("BusinessContract", businessContractSchema);

export default BusinessContract;