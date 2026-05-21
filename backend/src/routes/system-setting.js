import { Router } from "express";

import { getSystemSettings, updateSystemSettings } from "../controllers/systemSettingController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, getSystemSettings);
router.put("/", authenticate, updateSystemSettings);

export default router;
