import { Router } from "express";

import {
  createProgramSource,
  deleteProgramSource,
  deleteProgramSources,
  getProgramSourceById,
  listProgramSources,
  sendProgramSourceMailById,
  updateProgramSource,
} from "../controllers/programSourceController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("source.view"), listProgramSources);
router.delete("/", authenticate, requirePermission("source.delete"), deleteProgramSources);
router.post("/", authenticate, requirePermission("source.create"), createProgramSource);
router.post("/:id/send-mail", authenticate, requirePermission("source.sendMail"), sendProgramSourceMailById);
router.get("/:id", authenticate, requirePermission("source.view"), getProgramSourceById);
router.put("/:id", authenticate, requireAnyPermission("source.update", "source.updateStatus"), updateProgramSource);
router.delete("/:id", authenticate, requirePermission("source.delete"), deleteProgramSource);

export default router;
