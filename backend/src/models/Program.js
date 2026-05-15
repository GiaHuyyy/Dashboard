import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    durationValue: {
      type: Number,
      required: true,
      min: 0.1,
    },
    durationUnit: {
      type: String,
      required: true,
      enum: ["h", "ngày"],
    },
    convert: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      default: "program",
      trim: true,
    },
    programCreatedAt: {
      type: Date,
      default: Date.now,
    },
    design: {
      type: Boolean,
      required: true,
      default: false,
    },
    visible: {
      type: Boolean,
      required: true,
      default: true,
    },
    contractName: {
      type: String,
      required: true,
      trim: true,
    },
    contractCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contractImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Đã nhận", "Đang xử lý", "Hoàn thành"],
      required: true,
    },
    mailStatus: {
      type: String,
      enum: ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"],
      required: true,
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

const Program = mongoose.model("Program", programSchema);

export default Program;
