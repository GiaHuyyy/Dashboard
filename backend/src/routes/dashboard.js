import { Router } from "express";

import { getDashboardMonthlyStats, getDashboardProjectStatusSummary, getDashboardSummary } from "../controllers/dashboardController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/summary", authenticate, getDashboardSummary);
router.get("/monthly-stats", authenticate, getDashboardMonthlyStats);
router.get("/project-status-summary", authenticate, getDashboardProjectStatusSummary);

export default router;