import { Router } from "express";

import {
  createAdministrationPrice,
  deleteAdministrationPrice,
  deleteAdministrationPrices,
  getAdministrationPriceById,
  listAdministrationPrices,
  updateAdministrationPrice,
} from "../controllers/administrationPriceController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requireAnyPermission(PERMISSIONS.PRICE_VIEW, PERMISSIONS.SOURCE_CREATE, PERMISSIONS.SOURCE_UPDATE), listAdministrationPrices);
router.delete("/", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteAdministrationPrices);
router.post("/", authenticate, requirePermission(PERMISSIONS.PRICE_CREATE), createAdministrationPrice);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_VIEW), getAdministrationPriceById);
router.put("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_UPDATE), updateAdministrationPrice);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteAdministrationPrice);

export default router;
