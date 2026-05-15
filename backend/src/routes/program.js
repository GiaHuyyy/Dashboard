import { Router } from "express";

import { createProgram, listPrograms } from "../controllers/programController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listPrograms);
router.post("/", authenticate, createProgram);

export default router;
