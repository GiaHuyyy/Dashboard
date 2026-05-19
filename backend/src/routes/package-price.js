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

const router = Router();

router.get("/", authenticate, listPackagePrices);
router.delete("/", authenticate, deletePackagePrices);
router.post("/", authenticate, createPackagePrice);
router.get("/:id", authenticate, getPackagePriceById);
router.put("/:id", authenticate, updatePackagePrice);
router.delete("/:id", authenticate, deletePackagePrice);

export default router;
