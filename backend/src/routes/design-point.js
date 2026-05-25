import { Router } from "express";

import { listDesignPoints } from "../controllers/designPointController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("design.view"), listDesignPoints);

export default router;
