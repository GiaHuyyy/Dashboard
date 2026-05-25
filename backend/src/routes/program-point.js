import { Router } from "express";

import { listProgramPoints } from "../controllers/programPointController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("program.view"), listProgramPoints);

export default router;
