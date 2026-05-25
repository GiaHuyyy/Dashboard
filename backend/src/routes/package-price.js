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
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("price.view"), listPackagePrices);
router.delete("/", authenticate, requirePermission("price.delete"), deletePackagePrices);
router.post("/", authenticate, requirePermission("price.create"), createPackagePrice);
router.get("/:id", authenticate, requirePermission("price.view"), getPackagePriceById);
router.put("/:id", authenticate, requirePermission("price.update"), updatePackagePrice);
router.delete("/:id", authenticate, requirePermission("price.delete"), deletePackagePrice);

export default router;
