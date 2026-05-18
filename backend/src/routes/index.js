import { Router } from "express";

import authRoutes from "./auth.js";
import programCorrectionRoutes from "./program-correction.js";
import programPointRoutes from "./program-point.js";
import programUpgradeRoutes from "./program-upgrade.js";
import programRoutes from "./program.js";
import uploadRoutes from "./upload.js";
import authenticate from "../middleware/authenticate.js";
import authorizeRoles from "../middleware/authorizeRoles.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Dashboard API đang chạy" });
});

router.use("/auth", authRoutes);
router.use("/programs", programRoutes);
router.use("/program-corrections", programCorrectionRoutes);
router.use("/program-points", programPointRoutes);
router.use("/program-upgrades", programUpgradeRoutes);
router.use("/upload", uploadRoutes);

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
