import { Router } from "express";

import { getRolePermissions, updateRolePermission } from "../controllers/rolePermissionController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.PERMISSION_ROLE_VIEW), getRolePermissions);
router.put("/:role", authenticate, requirePermission(PERMISSIONS.PERMISSION_ROLE_UPDATE), updateRolePermission);

export default router;
