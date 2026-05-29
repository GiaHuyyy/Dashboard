import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
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
    bonusPoint: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    assigner: {
      type: String,
      required: true,
      trim: true,
    },
    assignee: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    businessContractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessContract",
      required: true,
      index: true,
    },
    designTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DesignTask",
      default: null,
      index: true,
    },
    designTaskTitle: {
      type: String,
      trim: true,
      default: "",
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
    assignedAt: {
      type: Date,
      required: true,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    dueAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    processingStatus: {
      type: String,
      required: true,
      default: "Mới tạo",
      index: true,
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
    note: {
      type: String,
      trim: true,
      default: "",
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
      // Lưu snapshot ảnh hợp đồng tại thời điểm tạo/cập nhật phiếu lập trình.
      // Hỗ trợ cả dữ liệu cũ dạng string URL và dữ liệu mới dạng object { url, publicId }.
      type: [mongoose.Schema.Types.Mixed],
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

const Program = mongoose.model("Program", programSchema);

export default Program;