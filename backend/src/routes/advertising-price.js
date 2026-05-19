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

const router = Router();

router.get("/", authenticate, listAdvertisingPrices);
router.delete("/", authenticate, deleteAdvertisingPrices);
router.post("/", authenticate, createAdvertisingPrice);
router.get("/:id", authenticate, getAdvertisingPriceById);
router.put("/:id", authenticate, updateAdvertisingPrice);
router.delete("/:id", authenticate, deleteAdvertisingPrice);

export default router;
