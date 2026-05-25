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

const router = Router();

router.get("/", authenticate, requirePermission("upgrade.view"), listProgramUpgrades);
router.delete("/", authenticate, requirePermission("upgrade.delete"), deleteProgramUpgrades);
router.get("/:id", authenticate, requirePermission("upgrade.view"), getProgramUpgradeById);
router.put("/:id", authenticate, requireAnyPermission("upgrade.update", "upgrade.updateStatus"), updateProgramUpgrade);
router.delete("/:id", authenticate, requirePermission("upgrade.delete"), deleteProgramUpgrade);
router.post("/", authenticate, requirePermission("upgrade.create"), createProgramUpgrade);

export default router;
