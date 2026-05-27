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
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.SOURCE_VIEW), listProgramSources);
router.delete("/", authenticate, requirePermission(PERMISSIONS.SOURCE_DELETE), deleteProgramSources);
router.post("/", authenticate, requirePermission(PERMISSIONS.SOURCE_CREATE), createProgramSource);
router.post("/:id/send-mail", authenticate, requirePermission(PERMISSIONS.SOURCE_SEND_MAIL), sendProgramSourceMailById);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.SOURCE_VIEW), getProgramSourceById);
router.put("/:id", authenticate, requireAnyPermission(PERMISSIONS.SOURCE_UPDATE, PERMISSIONS.SOURCE_UPDATE_STATUS), updateProgramSource);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.SOURCE_DELETE), deleteProgramSource);

export default router;
