import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    departments: {
      type: [String],
      default: ["Lập trình"],
    },
    roles: {
      type: [String],
      default: ["Lập trình viên"],
    },
    department: {
      type: String,
      trim: true,
      default: "Lập trình",
    },
    role: {
      type: String,
      trim: true,
      default: "Lập trình viên",
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
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

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
