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

const router = Router();

router.get("/", authenticate, requirePermission("design.view"), listDesignTasks);
router.get("/references", authenticate, requireAnyPermission("design.view", "design.create"), listDesignReferences);
router.delete("/", authenticate, requirePermission("design.delete"), deleteDesignTasks);
router.post("/", authenticate, requirePermission("design.create"), createDesignTask);
router.get("/:id", authenticate, requirePermission("design.view"), getDesignTaskById);
router.put("/:id", authenticate, requireAnyPermission("design.update", "design.updateStatus", "design.updatePoint"), updateDesignTask);
router.delete("/:id", authenticate, requirePermission("design.delete"), deleteDesignTask);

export default router;
