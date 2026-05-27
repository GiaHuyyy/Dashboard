import { Router } from "express";

import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import {
  createStaff,
  deleteStaff,
  getStaffById,
  listStaffReferences,
  listStaffs,
  updateStaff,
} from "../controllers/staffController.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(PERMISSIONS.STAFF_VIEW), listStaffs);
router.get(
  "/references",
  requireAnyPermission(
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.PROGRAM_CREATE,
    PERMISSIONS.PROGRAM_UPDATE,
    PERMISSIONS.DESIGN_CREATE,
    PERMISSIONS.DESIGN_UPDATE,
    PERMISSIONS.CORRECTION_CREATE,
    PERMISSIONS.CORRECTION_UPDATE,
    PERMISSIONS.UPGRADE_CREATE,
    PERMISSIONS.UPGRADE_UPDATE,
    PERMISSIONS.CONTRACT_CREATE,
    PERMISSIONS.CONTRACT_UPDATE,
    PERMISSIONS.SOURCE_CREATE,
    PERMISSIONS.SOURCE_UPDATE,
  ),
  listStaffReferences,
);
router.post("/", requirePermission(PERMISSIONS.STAFF_CREATE), createStaff);
router.get("/:id", requirePermission(PERMISSIONS.STAFF_VIEW), getStaffById);
router.put("/:id", requirePermission(PERMISSIONS.STAFF_UPDATE), updateStaff);
router.delete("/:id", requirePermission(PERMISSIONS.STAFF_DELETE), deleteStaff);

export default router;
