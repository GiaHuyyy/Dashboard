import { Router } from "express";

import { createProgram, listPrograms, validateProgram } from "../controllers/programController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listPrograms);
router.post("/validate", authenticate, validateProgram);
router.post("/", authenticate, createProgram);

export default router;
