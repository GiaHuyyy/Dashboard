import { Router } from "express";

import { getDashboardSummary } from "../controllers/dashboardController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/summary", authenticate, getDashboardSummary);

export default router;
