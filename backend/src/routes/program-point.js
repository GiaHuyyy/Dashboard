import { Router } from "express";

import { listProgramPoints } from "../controllers/programPointController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listProgramPoints);

export default router;
