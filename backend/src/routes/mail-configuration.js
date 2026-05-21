import { Router } from "express";

import { getMailConfiguration, updateMailConfiguration } from "../controllers/mailConfigurationController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, getMailConfiguration);
router.put("/", authenticate, updateMailConfiguration);

export default router;
