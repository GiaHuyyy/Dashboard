import { Router } from "express";

import {
  createAdvertisingPrice,
  deleteAdvertisingPrice,
  deleteAdvertisingPrices,
  getAdvertisingPriceById,
  listAdvertisingPrices,
  updateAdvertisingPrice,
} from "../controllers/advertisingPriceController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requireAnyPermission(PERMISSIONS.PRICE_VIEW, PERMISSIONS.SOURCE_CREATE, PERMISSIONS.SOURCE_UPDATE), listAdvertisingPrices);
router.delete("/", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteAdvertisingPrices);
router.post("/", authenticate, requirePermission(PERMISSIONS.PRICE_CREATE), createAdvertisingPrice);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_VIEW), getAdvertisingPriceById);
router.put("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_UPDATE), updateAdvertisingPrice);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteAdvertisingPrice);

export default router;
