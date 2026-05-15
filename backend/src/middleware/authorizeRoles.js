const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: "User role not found in token" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };

export default authorizeRoles;
