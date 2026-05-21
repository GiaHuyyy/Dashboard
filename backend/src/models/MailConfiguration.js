import mongoose from "mongoose";

const mailConfigurationSchema = new mongoose.Schema(
  {
    smtpHost: {
      type: String,
      trim: true,
      default: "",
    },
    smtpPort: {
      type: Number,
      min: 1,
      max: 65535,
      default: 587,
    },
    smtpSecure: {
      type: Boolean,
      default: false,
    },
    smtpUser: {
      type: String,
      trim: true,
      default: "",
    },
    smtpPassword: {
      type: String,
      default: "",
    },
    fromEmail: {
      type: String,
      trim: true,
      default: "",
    },
    fromName: {
      type: String,
      trim: true,
      default: "Dashboard",
    },
    enableRealSend: {
      type: Boolean,
      default: false,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
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

const MailConfiguration = mongoose.model("MailConfiguration", mailConfigurationSchema);

export default MailConfiguration;