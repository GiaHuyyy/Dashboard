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

const router = Router();

router.get("/", authenticate, listProgramUpgrades);
router.delete("/", authenticate, deleteProgramUpgrades);
router.get("/:id", authenticate, getProgramUpgradeById);
router.put("/:id", authenticate, updateProgramUpgrade);
router.delete("/:id", authenticate, deleteProgramUpgrade);
router.post("/", authenticate, createProgramUpgrade);

export default router;
