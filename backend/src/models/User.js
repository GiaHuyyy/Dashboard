import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

export const USER_ROLES = ["super_admin", "admin", "manager", "developer", "designer", "sale", "viewer", "user"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      default: "user",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function save() {
  if (!this.isModified("password")) {
    return;
  }

  if (BCRYPT_HASH_REGEX.test(this.password)) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function comparePassword(password) {
  if (BCRYPT_HASH_REGEX.test(this.password)) {
    return bcrypt.compare(password, this.password);
  }

  return this.password === password;
};

const User = mongoose.model("User", userSchema);

export default User;
