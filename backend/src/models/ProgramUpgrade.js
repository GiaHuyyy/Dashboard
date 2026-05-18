import mongoose from "mongoose";

const programUpgradeSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    upgradeItem: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["Thấp", "Trung bình", "Cao", "Khẩn"],
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
    time: {
      type: String,
      required: true,
      trim: true,
    },
    convert: {
      type: String,
      required: true,
      trim: true,
    },
    slaHours: {
      type: Number,
      required: true,
      min: 1,
    },
    bonusPoint: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["Mới tạo", "Đang xử lý", "Hoàn thành", "Tạm dừng"],
      index: true,
    },
    assignee: {
      type: String,
      required: true,
      trim: true,
    },
    assigner: {
      type: String,
      required: true,
      trim: true,
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

const ProgramUpgrade = mongoose.model("ProgramUpgrade", programUpgradeSchema);

export default ProgramUpgrade;
