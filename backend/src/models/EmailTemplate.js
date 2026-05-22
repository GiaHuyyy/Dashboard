import mongoose from "mongoose";

const TEMPLATE_TYPES = ["program", "source", "contract", "correction", "upgrade"];
const TEMPLATE_STATUSES = ["draft", "active"];

const emailTemplateSchema = new mongoose.Schema(
  {
    templateType: {
      type: String,
      required: true,
      enum: TEMPLATE_TYPES,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      default: "",
    },
    status: {
      type: String,
      required: true,
      enum: TEMPLATE_STATUSES,
      default: "draft",
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
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
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

emailTemplateSchema.index({ templateType: 1, name: 1, isDeleted: 1 });

const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);

export default EmailTemplate;
