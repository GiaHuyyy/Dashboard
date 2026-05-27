import { Router } from "express";

import { getSystemSettings, updateSystemSettings } from "../controllers/systemSettingController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.CONFIG_SETTING_VIEW), getSystemSettings);
router.put("/", authenticate, requirePermission(PERMISSIONS.CONFIG_SETTING_UPDATE), updateSystemSettings);

export default router;
