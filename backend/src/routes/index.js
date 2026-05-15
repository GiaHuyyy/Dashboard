import { Router } from "express";

import authRoutes from "./auth.js";
import programRoutes from "./program.js";
import authenticate from "../middleware/authenticate.js";
import authorizeRoles from "../middleware/authorizeRoles.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Dashboard API đang chạy" });
});

router.use("/auth", authRoutes);
router.use("/programs", programRoutes);

router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "Bạn đã xác thực",
    user: req.user,
  });
});

router.get("/admin", authenticate, authorizeRoles("admin"), (req, res) => {
  res.json({
    message: "Truy cập admin được cấp",
    role: req.user.role,
  });
});

export default router;
