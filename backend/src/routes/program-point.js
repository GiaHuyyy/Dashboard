import { Router } from "express";

import { listProgramPoints } from "../controllers/programPointController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.PROGRAM_VIEW), listProgramPoints);

export default router;
