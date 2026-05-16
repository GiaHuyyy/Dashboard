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

const router = Router();

router.get("/", authenticate, listProgramCorrections);
router.delete("/", authenticate, deleteProgramCorrections);
router.get("/:id", authenticate, getProgramCorrectionById);
router.put("/:id", authenticate, updateProgramCorrection);
router.delete("/:id", authenticate, deleteProgramCorrection);
router.post("/", authenticate, createProgramCorrection);

export default router;
