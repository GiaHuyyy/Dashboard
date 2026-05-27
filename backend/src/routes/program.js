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
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.PROGRAM_VIEW), listPrograms);
router.get(
  "/references",
  authenticate,
  requireAnyPermission(
    PERMISSIONS.PROGRAM_VIEW,
    PERMISSIONS.PROGRAM_CREATE,
    PERMISSIONS.PROGRAM_UPDATE,
    PERMISSIONS.SOURCE_CREATE,
    PERMISSIONS.SOURCE_UPDATE,
    PERMISSIONS.CORRECTION_CREATE,
    PERMISSIONS.CORRECTION_UPDATE,
    PERMISSIONS.UPGRADE_CREATE,
    PERMISSIONS.UPGRADE_UPDATE,
  ),
  listProgramReferences,
);
router.post("/validate", authenticate, requireAnyPermission(PERMISSIONS.PROGRAM_CREATE, PERMISSIONS.PROGRAM_UPDATE), validateProgram);
router.delete("/", authenticate, requirePermission(PERMISSIONS.PROGRAM_DELETE), deletePrograms);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.PROGRAM_VIEW), getProgramById);
router.put(
  "/:id",
  authenticate,
  requireAnyPermission(PERMISSIONS.PROGRAM_UPDATE, PERMISSIONS.PROGRAM_UPDATE_STATUS, PERMISSIONS.PROGRAM_UPDATE_POINT),
  updateProgram,
);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.PROGRAM_DELETE), deleteProgram);
router.post("/", authenticate, requirePermission(PERMISSIONS.PROGRAM_CREATE), createProgram);

export default router;
