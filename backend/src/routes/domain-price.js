import { Router } from "express";

import {
  createDomainPrice,
  deleteDomainPrice,
  deleteDomainPrices,
  getDomainPriceById,
  listDomainPrices,
  updateDomainPrice,
} from "../controllers/domainPriceController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requireAnyPermission(PERMISSIONS.PRICE_VIEW, PERMISSIONS.SOURCE_CREATE, PERMISSIONS.SOURCE_UPDATE), listDomainPrices);
router.delete("/", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteDomainPrices);
router.post("/", authenticate, requirePermission(PERMISSIONS.PRICE_CREATE), createDomainPrice);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_VIEW), getDomainPriceById);
router.put("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_UPDATE), updateDomainPrice);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.PRICE_DELETE), deleteDomainPrice);

export default router;
