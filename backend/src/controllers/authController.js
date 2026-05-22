import jwt from "jsonwebtoken";

import User, { getUserRoles } from "../models/User.js";

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;
const COOKIE_NAME = process.env.JWT_COOKIE_NAME || "access_token";
const ALLOW_PUBLIC_REGISTER = process.env.ALLOW_PUBLIC_REGISTER === "true";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000,
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

const createToken = (user) => {
  const roles = getUserRoles(user);

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: roles[0],
      roles,
      userName: user.userName,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );
};

const sanitizeUser = (user) => {
  const roles = getUserRoles(user);

  return {
    id: user._id,
    name: user.name,
    userName: user.userName,
    role: roles[0],
    roles,
    isActive: user.isActive !== false,
  };
};

export const register = async (req, res) => {
  if (!ALLOW_PUBLIC_REGISTER) {
    return res.status(403).json({
      message: "Dashboard nội bộ không cho đăng ký tự do. Vui lòng liên hệ quản trị viên để được cấp tài khoản.",
    });
  }

  const { name, userName, password } = req.body;

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET chưa được cấu hình" });
  }

  if (!name || !userName || !password) {
    return res.status(400).json({
      message: "name, userName và password là bắt buộc",
    });
  }

  const existingUser = await User.findOne({ userName: String(userName).trim() });
  if (existingUser) {
    return res.status(409).json({ message: "userName đã tồn tại" });
  }

  const user = await User.create({
    name,
    userName,
    password,
    role: "user",
    roles: ["user"],
    isActive: true,
  });

  const token = createToken(user);

  res.cookie(COOKIE_NAME, token, getCookieOptions());

  return res.status(201).json({
    message: "Đăng ký thành công",
    user: sanitizeUser(user),
  });
};

export const login = async (req, res) => {
  const { userName, password } = req.body;

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET chưa được cấu hình" });
  }

  if (!userName || !password) {
    return res.status(400).json({
      message: "userName và password là bắt buộc",
    });
  }

  const user = await User.findOne({ userName: String(userName).trim() });
  if (!user) {
    return res.status(401).json({ message: "Thông tin đăng nhập không hợp lệ" });
  }

  if (user.isActive === false) {
    return res.status(403).json({ message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên." });
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Thông tin đăng nhập không hợp lệ" });
  }

  // Upgrade existing plain-text passwords to bcrypt hash after a successful login.
  if (!BCRYPT_HASH_REGEX.test(user.password)) {
    user.password = password;
  }

  const roles = getUserRoles(user);
  if (JSON.stringify(user.roles || []) !== JSON.stringify(roles) || user.role !== roles[0]) {
    user.roles = roles;
    user.role = roles[0];
  }

  if (user.isModified()) {
    await user.save();
  }

  const token = createToken(user);

  res.cookie(COOKIE_NAME, token, getCookieOptions());

  return res.json({
    message: "Đăng nhập thành công",
    user: sanitizeUser(user),
  });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.sub).select("-password");
  if (!user) {
    return res.status(404).json({ message: "Người dùng không tồn tại" });
  }

  if (user.isActive === false) {
    return res.status(403).json({ message: "Tài khoản đã bị khóa" });
  }

  return res.json(sanitizeUser(user));
};

export const logout = async (req, res) =>
  res.clearCookie(COOKIE_NAME, getClearCookieOptions()).json({ message: "Đăng xuất thành công" });
