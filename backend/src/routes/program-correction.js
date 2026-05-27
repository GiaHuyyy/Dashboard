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
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.CORRECTION_VIEW), listProgramCorrections);
router.delete("/", authenticate, requirePermission(PERMISSIONS.CORRECTION_DELETE), deleteProgramCorrections);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.CORRECTION_VIEW), getProgramCorrectionById);
router.put("/:id", authenticate, requireAnyPermission(PERMISSIONS.CORRECTION_UPDATE, PERMISSIONS.CORRECTION_UPDATE_STATUS), updateProgramCorrection);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.CORRECTION_DELETE), deleteProgramCorrection);
router.post("/", authenticate, requirePermission(PERMISSIONS.CORRECTION_CREATE), createProgramCorrection);

export default router;
