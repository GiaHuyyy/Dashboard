import mongoose from "mongoose";

const programCorrectionSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    issueContent: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      required: true,
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
    bonusPoint: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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
    status: {
      type: String,
      required: true,
      index: true,
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

const ProgramCorrection = mongoose.model("ProgramCorrection", programCorrectionSchema);

export default ProgramCorrection;