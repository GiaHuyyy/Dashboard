import { Router } from "express";

import { getRolePermissions, updateRolePermission } from "../controllers/rolePermissionController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, getRolePermissions);
router.put("/:role", authenticate, updateRolePermission);

export default router;
