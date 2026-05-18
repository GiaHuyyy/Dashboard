import { Router } from "express";

import authenticate from "../middleware/authenticate.js";
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

router.get("/", listStaffs);
router.get("/references", listStaffReferences);
router.post("/", createStaff);
router.get("/:id", getStaffById);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export default router;
