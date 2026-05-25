import { Router } from "express";

import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";
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

router.get("/", requirePermission("contract.view"), listBusinessContracts);
router.get("/references", requirePermission("contract.view"), listBusinessContractReferences);
router.delete("/", requirePermission("contract.delete"), deleteBusinessContracts);
router.post("/", requirePermission("contract.create"), createBusinessContract);
router.get("/:id", requirePermission("contract.view"), getBusinessContractById);
router.put("/:id", requirePermission("contract.update"), updateBusinessContract);
router.delete("/:id", requirePermission("contract.delete"), deleteBusinessContract);
router.post("/:id/handover", requirePermission("contract.sendMail"), handoverBusinessContract);

export default router;
