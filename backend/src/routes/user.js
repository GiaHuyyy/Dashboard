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

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("permission.user.view"), listUsers);
router.post("/", requirePermission("permission.user.create"), createUser);
router.get("/:id", requirePermission("permission.user.view"), getUserById);
router.put("/:id", requirePermission("permission.user.update"), updateUser);
router.delete("/:id", requirePermission("permission.user.delete"), deleteUser);

export default router;
