import mongoose from "mongoose";

const programSourceSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    sourceLink: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    hostPriceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HostPrice",
      default: null,
    },
    sslPriceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SslPrice",
      default: null,
    },
    packagePriceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackagePrice",
      default: null,
    },
    administrationPriceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdministrationPrice",
      default: null,
    },
    advertisingPriceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdvertisingPrice",
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    sendStatus: {
      type: String,
      required: true,
      enum: ["Chưa gửi", "Đã gửi"],
      default: "Chưa gửi",
      index: true,
    },
    downloadStatus: {
      type: String,
      required: true,
      enum: ["Chưa tải", "Đã tải"],
      default: "Chưa tải",
    },
    downloadedAt: {
      type: Date,
      default: null,
    },
    downloadCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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

const ProgramSource = mongoose.model("ProgramSource", programSourceSchema);

export default ProgramSource;
