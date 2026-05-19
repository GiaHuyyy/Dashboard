import { Router } from "express";

import authenticate from "../middleware/authenticate.js";
import {
  createBusinessContract,
  deleteBusinessContract,
  deleteBusinessContracts,
  getBusinessContractById,
  handoverBusinessContract,
  listBusinessContractReferences,
  listBusinessContracts,
  updateBusinessContract,
} from "../controllers/businessContractController.js";

const router = Router();

router.use(authenticate);

router.get("/", listBusinessContracts);
router.get("/references", listBusinessContractReferences);
router.delete("/", deleteBusinessContracts);
router.post("/", createBusinessContract);
router.get("/:id", getBusinessContractById);
router.put("/:id", updateBusinessContract);
router.delete("/:id", deleteBusinessContract);
router.post("/:id/handover", handoverBusinessContract);

export default router;
