const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);

    if (userRoles.length === 0) {
      return res.status(401).json({ message: "Vai trò người dùng không được tìm thấy trong token" });
    }

    if (!userRoles.some((role) => roles.includes(role))) {
      return res.status(403).json({ message: "Truy cập bị cấm" });
    }

    return next();
  };

export default authorizeRoles;
