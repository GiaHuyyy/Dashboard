import { Router } from "express";

import authRoutes from "./auth.js";
import authenticate from "../middleware/authenticate.js";
import authorizeRoles from "../middleware/authorizeRoles.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Dashboard API is running" });
});

router.use("/auth", authRoutes);

router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});

router.get("/admin", authenticate, authorizeRoles("admin"), (req, res) => {
  res.json({
    message: "Admin access granted",
    role: req.user.role,
  });
});

export default router;
