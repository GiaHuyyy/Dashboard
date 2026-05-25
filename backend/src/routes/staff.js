import { Router } from "express";

import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
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

router.get("/", requirePermission("staff.view"), listStaffs);
router.get(
  "/references",
  requireAnyPermission(
    "staff.view",
    "staff.create",
    "staff.update",
    "program.create",
    "program.update",
    "design.create",
    "design.update",
    "correction.create",
    "correction.update",
    "upgrade.create",
    "upgrade.update",
    "contract.create",
    "contract.update",
    "source.create",
    "source.update",
  ),
  listStaffReferences,
);
router.post("/", requirePermission("staff.create"), createStaff);
router.get("/:id", requirePermission("staff.view"), getStaffById);
router.put("/:id", requirePermission("staff.update"), updateStaff);
router.delete("/:id", requirePermission("staff.delete"), deleteStaff);

export default router;
