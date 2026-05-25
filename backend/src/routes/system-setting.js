import { Router } from "express";

import { getSystemSettings, updateSystemSettings } from "../controllers/systemSettingController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("config.setting.view"), getSystemSettings);
router.put("/", authenticate, requirePermission("config.setting.update"), updateSystemSettings);

export default router;
