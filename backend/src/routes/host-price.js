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

const router = Router();

router.get("/", authenticate, listHostPrices);
router.delete("/", authenticate, deleteHostPrices);
router.post("/", authenticate, createHostPrice);
router.get("/:id", authenticate, getHostPriceById);
router.put("/:id", authenticate, updateHostPrice);
router.delete("/:id", authenticate, deleteHostPrice);

export default router;
