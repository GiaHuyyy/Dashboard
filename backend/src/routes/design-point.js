import { Router } from "express";

import { listDesignPoints } from "../controllers/designPointController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.DESIGN_VIEW), listDesignPoints);

export default router;
