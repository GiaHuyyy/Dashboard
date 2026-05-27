import { Router } from "express";

import {
  createSystemCategory,
  deleteSystemCategory,
  deleteSystemCategories,
  getSystemCategoryById,
  listSystemCategories,
  updateSystemCategory,
} from "../controllers/systemCategoryController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, listSystemCategories);

router.delete("/", authenticate, requirePermission(PERMISSIONS.CONFIG_CATEGORY_UPDATE), deleteSystemCategories);
router.post("/", authenticate, requirePermission(PERMISSIONS.CONFIG_CATEGORY_UPDATE), createSystemCategory);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.CONFIG_CATEGORY_VIEW), getSystemCategoryById);
router.put("/:id", authenticate, requirePermission(PERMISSIONS.CONFIG_CATEGORY_UPDATE), updateSystemCategory);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.CONFIG_CATEGORY_UPDATE), deleteSystemCategory);

export default router;
