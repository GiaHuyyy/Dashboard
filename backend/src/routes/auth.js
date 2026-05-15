import { Router } from "express";

import { login, logout, me, register } from "../controllers/authController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

// Public routes
// Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, me);

// Protected routes
export default router;
