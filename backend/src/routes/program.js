import { Router } from "express";

import {
  createProgram,
  deleteProgram,
  deletePrograms,
  getProgramById,
  listProgramReferences,
  listPrograms,
  updateProgram,
  validateProgram,
} from "../controllers/programController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listPrograms);
router.get("/references", authenticate, listProgramReferences);
router.post("/validate", authenticate, validateProgram);
router.delete("/", authenticate, deletePrograms);
router.get("/:id", authenticate, getProgramById);
router.put("/:id", authenticate, updateProgram);
router.delete("/:id", authenticate, deleteProgram);
router.post("/", authenticate, createProgram);

export default router;
