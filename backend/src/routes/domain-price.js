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
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("price.view"), listDomainPrices);
router.delete("/", authenticate, requirePermission("price.delete"), deleteDomainPrices);
router.post("/", authenticate, requirePermission("price.create"), createDomainPrice);
router.get("/:id", authenticate, requirePermission("price.view"), getDomainPriceById);
router.put("/:id", authenticate, requirePermission("price.update"), updateDomainPrice);
router.delete("/:id", authenticate, requirePermission("price.delete"), deleteDomainPrice);

export default router;
