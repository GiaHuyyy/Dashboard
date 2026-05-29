import mongoose from "mongoose";

const designTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    designType: {
      type: String,
      required: true,
      enum: ["Logo", "Banner", "Landing page", "UI/UX", "Social post"],
      index: true,
    },
    priority: {
      type: String,
      required: true,
      default: "Trung bình",
      index: true,
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
      type: Number,
      required: true,
      min: 0,
      default: 0,
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
      default: "Mới tạo",
      index: true,
    },
    handoverDate: {
      type: Date,
      default: null,
    },
    receiveDate: {
      type: Date,
      default: null,
    },
    expectedDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
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

const DesignTask = mongoose.model("DesignTask", designTaskSchema);

export default DesignTask;