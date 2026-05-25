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
import requirePermission from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("price.view"), listSslPrices);
router.delete("/", authenticate, requirePermission("price.delete"), deleteSslPrices);
router.post("/", authenticate, requirePermission("price.create"), createSslPrice);
router.get("/:id", authenticate, requirePermission("price.view"), getSslPriceById);
router.put("/:id", authenticate, requirePermission("price.update"), updateSslPrice);
router.delete("/:id", authenticate, requirePermission("price.delete"), deleteSslPrice);

export default router;
