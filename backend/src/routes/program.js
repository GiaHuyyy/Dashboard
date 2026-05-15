import { Router } from "express";

import {
  createProgram,
  getProgramById,
  listPrograms,
  updateProgram,
  validateProgram,
} from "../controllers/programController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listPrograms);
router.post("/validate", authenticate, validateProgram);
router.get("/:id", authenticate, getProgramById);
router.put("/:id", authenticate, updateProgram);
router.post("/", authenticate, createProgram);

export default router;
