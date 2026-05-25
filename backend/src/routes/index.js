
import { Router } from "express";

import authRoutes from "./auth.js";
import dashboardRoutes from "./dashboard.js";
import administrationPriceRoutes from "./administration-price.js";
import advertisingPriceRoutes from "./advertising-price.js";
import designPointRoutes from "./design-point.js";
import designRoutes from "./design.js";
import domainPriceRoutes from "./domain-price.js";
import programCorrectionRoutes from "./program-correction.js";
import programPointRoutes from "./program-point.js";
import hostPriceRoutes from "./host-price.js";
import packagePriceRoutes from "./package-price.js";
import programSourceRoutes from "./program-source.js";
import programUpgradeRoutes from "./program-upgrade.js";
import programRoutes from "./program.js";
import sslPriceRoutes from "./ssl-price.js";
import staffRoutes from "./staff.js";
import uploadRoutes from "./upload.js";
import businessContractRoutes from "./business-contract.js";
import systemCategoryRoutes from "./system-category.js";
import mailConfigurationRoutes from "./mail-configuration.js";
import systemSettingRoutes from "./system-setting.js";
import emailTemplateRoutes from "./email-template.js";
import userRoutes from "./user.js";
import rolePermissionRoutes from "./role-permission.js";
import authenticate from "../middleware/authenticate.js";
import authorizeRoles from "../middleware/authorizeRoles.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Dashboard API đang chạy" });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/programs", programRoutes);
router.use("/staffs", staffRoutes);
router.use("/program-corrections", programCorrectionRoutes);
router.use("/program-points", programPointRoutes);
router.use("/host-prices", hostPriceRoutes);
router.use("/ssl-prices", sslPriceRoutes);
router.use("/domain-prices", domainPriceRoutes);
router.use("/package-prices", packagePriceRoutes);
router.use("/administration-prices", administrationPriceRoutes);
router.use("/advertising-prices", advertisingPriceRoutes);
router.use("/designs", designRoutes);
router.use("/design-points", designPointRoutes);
router.use("/program-upgrades", programUpgradeRoutes);
router.use("/program-sources", programSourceRoutes);
router.use("/upload", uploadRoutes);
router.use("/business-contracts", businessContractRoutes);
router.use("/system-categories", systemCategoryRoutes);
router.use("/mail-configuration", mailConfigurationRoutes);
router.use("/system-settings", systemSettingRoutes);
router.use("/email-templates", emailTemplateRoutes);
router.use("/users", userRoutes);
router.use("/role-permissions", rolePermissionRoutes);

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
