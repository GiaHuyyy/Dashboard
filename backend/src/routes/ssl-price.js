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

const router = Router();

router.get("/", authenticate, listSslPrices);
router.delete("/", authenticate, deleteSslPrices);
router.post("/", authenticate, createSslPrice);
router.get("/:id", authenticate, getSslPriceById);
router.put("/:id", authenticate, updateSslPrice);
router.delete("/:id", authenticate, deleteSslPrice);

export default router;
