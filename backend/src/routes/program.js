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
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("program.view"), listPrograms);
router.get("/references", authenticate, requireAnyPermission("program.view", "program.create"), listProgramReferences);
router.post("/validate", authenticate, requireAnyPermission("program.create", "program.update"), validateProgram);
router.delete("/", authenticate, requirePermission("program.delete"), deletePrograms);
router.get("/:id", authenticate, requirePermission("program.view"), getProgramById);
router.put("/:id", authenticate, requireAnyPermission("program.update", "program.updateStatus", "program.updatePoint"), updateProgram);
router.delete("/:id", authenticate, requirePermission("program.delete"), deleteProgram);
router.post("/", authenticate, requirePermission("program.create"), createProgram);

export default router;
