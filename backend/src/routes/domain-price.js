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

const router = Router();

router.get("/", authenticate, listDomainPrices);
router.delete("/", authenticate, deleteDomainPrices);
router.post("/", authenticate, createDomainPrice);
router.get("/:id", authenticate, getDomainPriceById);
router.put("/:id", authenticate, updateDomainPrice);
router.delete("/:id", authenticate, deleteDomainPrice);

export default router;
