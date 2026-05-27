import { Router } from "express";

import {
  createSslPrice,
  deleteSslPrice,
  deleteSslPrices,
  getSslPriceById,
  listSslPrices,
  updateSslPrice,
} from "../controllers/sslPriceController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requireAnyPermission(PERMISSIONS.PRICE_VIEW, PERMISSIONS.SOURCE_CREATE, PERMISSIONS.SOURCE_UPDATE), listSslPrices);
router.delete("/", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteSslPrices);
router.post("/", authenticate, requirePermission(PERMISSIONS.PRICE_CREATE), createSslPrice);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_VIEW), getSslPriceById);
router.put("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_UPDATE), updateSslPrice);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteSslPrice);

export default router;
