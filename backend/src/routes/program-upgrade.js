import { Router } from "express";

import {
  createProgramUpgrade,
  deleteProgramUpgrade,
  deleteProgramUpgrades,
  getProgramUpgradeById,
  listProgramUpgrades,
  updateProgramUpgrade,
} from "../controllers/programUpgradeController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.UPGRADE_VIEW), listProgramUpgrades);
router.delete("/", authenticate, requirePermission(PERMISSIONS.UPGRADE_DELETE), deleteProgramUpgrades);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.UPGRADE_VIEW), getProgramUpgradeById);
router.put("/:id", authenticate, requireAnyPermission(PERMISSIONS.UPGRADE_UPDATE, PERMISSIONS.UPGRADE_UPDATE_STATUS), updateProgramUpgrade);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.UPGRADE_DELETE), deleteProgramUpgrade);
router.post("/", authenticate, requirePermission(PERMISSIONS.UPGRADE_CREATE), createProgramUpgrade);

export default router;
