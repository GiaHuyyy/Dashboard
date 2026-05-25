import { Router } from "express";

import { getRolePermissions, updateRolePermission } from "../controllers/rolePermissionController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("permission.role.view"), getRolePermissions);
router.put("/:role", authenticate, requirePermission("permission.role.update"), updateRolePermission);

export default router;
