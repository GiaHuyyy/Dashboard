import { Router } from "express";

import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import {
  createBusinessContract,
  deleteBusinessContract,
  deleteBusinessContracts,
  getBusinessContractById,
  getBusinessContractProfile,
  handoverBusinessContract,
  listBusinessContractReferences,
  listBusinessContracts,
  updateBusinessContract,
} from "../controllers/businessContractController.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(PERMISSIONS.CONTRACT_VIEW), listBusinessContracts);
router.get(
  "/references",
  requireAnyPermission(
    PERMISSIONS.CONTRACT_VIEW,
    PERMISSIONS.CONTRACT_CREATE,
    PERMISSIONS.CONTRACT_UPDATE,
    PERMISSIONS.PROGRAM_CREATE,
    PERMISSIONS.PROGRAM_UPDATE,
    PERMISSIONS.CORRECTION_CREATE,
    PERMISSIONS.CORRECTION_UPDATE,
    PERMISSIONS.UPGRADE_CREATE,
    PERMISSIONS.UPGRADE_UPDATE,
    PERMISSIONS.SOURCE_CREATE,
    PERMISSIONS.SOURCE_UPDATE,
  ),
  listBusinessContractReferences,
);
router.delete("/", requirePermission(PERMISSIONS.CONTRACT_DELETE), deleteBusinessContracts);
router.post("/", requirePermission(PERMISSIONS.CONTRACT_CREATE), createBusinessContract);
router.get("/:id/profile", requirePermission(PERMISSIONS.CONTRACT_VIEW), getBusinessContractProfile);
router.get("/:id", requirePermission(PERMISSIONS.CONTRACT_VIEW), getBusinessContractById);
router.put("/:id", requirePermission(PERMISSIONS.CONTRACT_UPDATE), updateBusinessContract);
router.delete("/:id", requirePermission(PERMISSIONS.CONTRACT_DELETE), deleteBusinessContract);
router.post("/:id/handover", requirePermission(PERMISSIONS.CONTRACT_SEND_MAIL), handoverBusinessContract);

export default router;