import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    userName: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
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
