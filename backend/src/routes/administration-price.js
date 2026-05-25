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

const router = Router();

router.get("/", authenticate, requireAnyPermission("price.view", "source.create", "source.update"), listAdministrationPrices);
router.delete("/", authenticate, requirePermission("price.delete"), deleteAdministrationPrices);
router.post("/", authenticate, requirePermission("price.create"), createAdministrationPrice);
router.get("/:id", authenticate, requirePermission("price.view"), getAdministrationPriceById);
router.put("/:id", authenticate, requirePermission("price.update"), updateAdministrationPrice);
router.delete("/:id", authenticate, requirePermission("price.delete"), deleteAdministrationPrice);

export default router;
