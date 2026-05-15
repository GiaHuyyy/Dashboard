import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
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
