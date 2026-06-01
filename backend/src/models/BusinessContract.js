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
      trim: true,
      default: "",
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
    contractType: {
      type: String,
      required: true,
      default: "Giao diện",
      index: true,
    },
    status: {
      type: String,
      required: true,
      default: "Chưa nhận",
      index: true,
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
    selectedManager: {
      type: String,
      trim: true,
      default: "",
    },
    salesReceiverName: {
      type: String,
      trim: true,
      default: "",
    },
    salesReceiverEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
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
      required: true,
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
