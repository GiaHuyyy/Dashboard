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
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("price.view"), listAdvertisingPrices);
router.delete("/", authenticate, requirePermission("price.delete"), deleteAdvertisingPrices);
router.post("/", authenticate, requirePermission("price.create"), createAdvertisingPrice);
router.get("/:id", authenticate, requirePermission("price.view"), getAdvertisingPriceById);
router.put("/:id", authenticate, requirePermission("price.update"), updateAdvertisingPrice);
router.delete("/:id", authenticate, requirePermission("price.delete"), deleteAdvertisingPrice);

export default router;
