import { Router } from "express";

import { createProgram } from "../controllers/programController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.post("/", authenticate, createProgram);

export default router;
