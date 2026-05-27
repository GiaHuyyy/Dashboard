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
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requireAnyPermission(PERMISSIONS.PRICE_VIEW, PERMISSIONS.SOURCE_CREATE, PERMISSIONS.SOURCE_UPDATE), listHostPrices);
router.delete("/", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteHostPrices);
router.post("/", authenticate, requirePermission(PERMISSIONS.PRICE_CREATE), createHostPrice);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_VIEW), getHostPriceById);
router.put("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_UPDATE), updateHostPrice);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteHostPrice);

export default router;
