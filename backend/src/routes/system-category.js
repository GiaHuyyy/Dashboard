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

const router = Router();

router.get("/", authenticate, listSystemCategories);

router.delete("/", authenticate, requirePermission("config.category.update"), deleteSystemCategories);
router.post("/", authenticate, requirePermission("config.category.update"), createSystemCategory);
router.get("/:id", authenticate, requirePermission("config.category.view"), getSystemCategoryById);
router.put("/:id", authenticate, requirePermission("config.category.update"), updateSystemCategory);
router.delete("/:id", authenticate, requirePermission("config.category.update"), deleteSystemCategory);

export default router;
