import mongoose from "mongoose";

const websiteTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    demoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    templateUrl: {
      type: String,
      trim: true,
      default: "",
    },
    previewImage: {
      type: String,
      trim: true,
      default: "",
    },
    previewImagePublicId: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    platform: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
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

const WebsiteTemplate = mongoose.model("WebsiteTemplate", websiteTemplateSchema);

export default WebsiteTemplate;