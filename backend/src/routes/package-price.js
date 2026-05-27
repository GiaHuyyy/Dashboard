import { Router } from "express";

import {
  createPackagePrice,
  deletePackagePrice,
  deletePackagePrices,
  getPackagePriceById,
  listPackagePrices,
  updatePackagePrice,
} from "../controllers/packagePriceController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requireAnyPermission(PERMISSIONS.PRICE_VIEW, PERMISSIONS.SOURCE_CREATE, PERMISSIONS.SOURCE_UPDATE), listPackagePrices);
router.delete("/", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deletePackagePrices);
router.post("/", authenticate, requirePermission(PERMISSIONS.PRICE_CREATE), createPackagePrice);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_VIEW), getPackagePriceById);
router.put("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_UPDATE), updatePackagePrice);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deletePackagePrice);

export default router;
