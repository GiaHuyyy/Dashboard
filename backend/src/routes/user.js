import { Router } from "express";

import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from "../controllers/userController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(PERMISSIONS.PERMISSION_USER_VIEW), listUsers);
router.post("/", requirePermission(PERMISSIONS.PERMISSION_USER_CREATE), createUser);
router.get("/:id", requirePermission(PERMISSIONS.PERMISSION_USER_VIEW), getUserById);
router.put("/:id", requirePermission(PERMISSIONS.PERMISSION_USER_UPDATE), updateUser);
router.delete("/:id", requirePermission(PERMISSIONS.PERMISSION_USER_DELETE), deleteUser);

export default router;
