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

const router = Router();

router.get("/", authenticate, listAdministrationPrices);
router.delete("/", authenticate, deleteAdministrationPrices);
router.post("/", authenticate, createAdministrationPrice);
router.get("/:id", authenticate, getAdministrationPriceById);
router.put("/:id", authenticate, updateAdministrationPrice);
router.delete("/:id", authenticate, deleteAdministrationPrice);

export default router;
