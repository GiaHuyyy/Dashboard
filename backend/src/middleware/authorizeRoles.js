const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: "Vai trò người dùng không được tìm thấy trong token" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Truy cập bị cấm" });
    }

    return next();
  };

export default authorizeRoles;
