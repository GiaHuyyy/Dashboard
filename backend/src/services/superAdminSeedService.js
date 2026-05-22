import User from "../models/User.js";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

export const seedSuperAdmin = async () => {
  const existingSuperAdmin = await User.findOne({ role: "super_admin" }).select("_id userName").lean();
  if (existingSuperAdmin) return;

  const name = normalizeString(process.env.SUPER_ADMIN_NAME) || "Super Admin";
  const userName = normalizeString(process.env.SUPER_ADMIN_USERNAME) || normalizeString(process.env.SUPER_ADMIN_EMAIL);
  const password = normalizeString(process.env.SUPER_ADMIN_PASSWORD);

  if (!userName || !password) {
    console.warn(
      "[SUPER_ADMIN] Chưa cấu hình SUPER_ADMIN_USERNAME hoặc SUPER_ADMIN_PASSWORD. " +
        "Hãy thêm vào .env để hệ thống tự tạo tài khoản quản trị đầu tiên.",
    );
    return;
  }

  const existingUser = await User.findOne({ userName });
  if (existingUser) {
    if (existingUser.role !== "super_admin") {
      existingUser.role = "super_admin";
      existingUser.isActive = true;
      await existingUser.save();
      console.log(`[SUPER_ADMIN] Đã nâng tài khoản ${userName} thành super_admin`);
    }
    return;
  }

  await User.create({
    name,
    userName,
    password,
    role: "super_admin",
    isActive: true,
    note: "Tài khoản quản trị cao nhất được tạo tự động khi khởi tạo hệ thống.",
  });

  console.log(`[SUPER_ADMIN] Đã tạo tài khoản super_admin: ${userName}`);
};
