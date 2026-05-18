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

const router = Router();

router.get("/", authenticate, listProgramSources);
router.delete("/", authenticate, deleteProgramSources);
router.post("/", authenticate, createProgramSource);
router.post("/:id/send-mail", authenticate, sendProgramSourceMailById);
router.get("/:id", authenticate, getProgramSourceById);
router.put("/:id", authenticate, updateProgramSource);
router.delete("/:id", authenticate, deleteProgramSource);

export default router;
