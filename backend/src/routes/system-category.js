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

const router = Router();

router.get("/", authenticate, listSystemCategories);
router.delete("/", authenticate, deleteSystemCategories);
router.post("/", authenticate, createSystemCategory);
router.get("/:id", authenticate, getSystemCategoryById);
router.put("/:id", authenticate, updateSystemCategory);
router.delete("/:id", authenticate, deleteSystemCategory);

export default router;
