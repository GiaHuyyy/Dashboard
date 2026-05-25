import { Router } from "express";

import {
  createHostPrice,
  deleteHostPrice,
  deleteHostPrices,
  getHostPriceById,
  listHostPrices,
  updateHostPrice,
} from "../controllers/hostPriceController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("price.view"), listHostPrices);
router.delete("/", authenticate, requirePermission("price.delete"), deleteHostPrices);
router.post("/", authenticate, requirePermission("price.create"), createHostPrice);
router.get("/:id", authenticate, requirePermission("price.view"), getHostPriceById);
router.put("/:id", authenticate, requirePermission("price.update"), updateHostPrice);
router.delete("/:id", authenticate, requirePermission("price.delete"), deleteHostPrice);

export default router;
