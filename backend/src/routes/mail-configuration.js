import { Router } from "express";

import { getMailConfiguration, updateMailConfiguration } from "../controllers/mailConfigurationController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.CONFIG_MAIL_VIEW), getMailConfiguration);
router.put("/", authenticate, requirePermission(PERMISSIONS.CONFIG_MAIL_UPDATE), updateMailConfiguration);

export default router;
