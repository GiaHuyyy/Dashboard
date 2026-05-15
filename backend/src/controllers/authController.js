import jwt from "jsonwebtoken";

import User from "../models/User.js";

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

const createToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      userName: user.userName,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  userName: user.userName,
  role: user.role,
});

export const register = async (req, res) => {
  const { name, userName, password, role = "user" } = req.body;

  if (!name || !userName || !password) {
    return res.status(400).json({
      message: "name, userName and password are required",
    });
  }

  const existingUser = await User.findOne({ userName });
  if (existingUser) {
    return res.status(409).json({ message: "userName already exists" });
  }

  const user = await User.create({
    name,
    userName,
    password,
    role,
  });

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET is not configured" });
  }

  const token = createToken(user);

  return res.status(201).json({
    message: "Register successful",
    token,
    tokenType: "Bearer",
    user: sanitizeUser(user),
  });
};

export const login = async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    return res.status(400).json({
      message: "userName and password are required",
    });
  }

  const user = await User.findOne({ userName });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET is not configured" });
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Upgrade existing plain-text passwords to bcrypt hash after a successful login.
  if (!BCRYPT_HASH_REGEX.test(user.password)) {
    user.password = password;
    await user.save();
  }

  const token = createToken(user);

  return res.json({
    token,
    tokenType: "Bearer",
    user: sanitizeUser(user),
  });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.sub).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(user);
};

export const logout = async (req, res) =>
  res.json({
    message: "Logout successful. Please remove token on client side.",
  });
