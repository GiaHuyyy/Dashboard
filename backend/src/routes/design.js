import { Router } from "express";

import {
  createDesignTask,
  deleteDesignTask,
  deleteDesignTasks,
  getDesignTaskById,
  listDesignReferences,
  listDesignTasks,
  updateDesignTask,
} from "../controllers/designController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.DESIGN_VIEW), listDesignTasks);
router.get(
  "/references",
  authenticate,
  requireAnyPermission(PERMISSIONS.DESIGN_VIEW, PERMISSIONS.DESIGN_CREATE, PERMISSIONS.DESIGN_UPDATE, PERMISSIONS.PROGRAM_CREATE, PERMISSIONS.PROGRAM_UPDATE),
  listDesignReferences,
);
router.delete("/", authenticate, requirePermission(PERMISSIONS.DESIGN_DELETE), deleteDesignTasks);
router.post("/", authenticate, requirePermission(PERMISSIONS.DESIGN_CREATE), createDesignTask);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.DESIGN_VIEW), getDesignTaskById);
router.put(
  "/:id",
  authenticate,
  requireAnyPermission(PERMISSIONS.DESIGN_UPDATE, PERMISSIONS.DESIGN_UPDATE_STATUS, PERMISSIONS.DESIGN_UPDATE_POINT),
  updateDesignTask,
);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.DESIGN_DELETE), deleteDesignTask);

export default router;
