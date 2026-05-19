import { Router } from "express";

import { listDesignPoints } from "../controllers/designPointController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listDesignPoints);

export default router;
