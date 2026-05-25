import { Router } from "express";

import {
  createProgramCorrection,
  deleteProgramCorrection,
  deleteProgramCorrections,
  getProgramCorrectionById,
  listProgramCorrections,
  updateProgramCorrection,
} from "../controllers/programCorrectionController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("correction.view"), listProgramCorrections);
router.delete("/", authenticate, requirePermission("correction.delete"), deleteProgramCorrections);
router.get("/:id", authenticate, requirePermission("correction.view"), getProgramCorrectionById);
router.put("/:id", authenticate, requireAnyPermission("correction.update", "correction.updateStatus"), updateProgramCorrection);
router.delete("/:id", authenticate, requirePermission("correction.delete"), deleteProgramCorrection);
router.post("/", authenticate, requirePermission("correction.create"), createProgramCorrection);

export default router;
