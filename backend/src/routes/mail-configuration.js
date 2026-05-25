import { Router } from "express";

import { getMailConfiguration, updateMailConfiguration } from "../controllers/mailConfigurationController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("config.mail.view"), getMailConfiguration);
router.put("/", authenticate, requirePermission("config.mail.update"), updateMailConfiguration);

export default router;
