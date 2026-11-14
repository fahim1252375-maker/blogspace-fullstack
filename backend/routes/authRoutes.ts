import { Router } from "express";
import { registerUser, loginUser, getMe } from "../controllers/authController.ts";
import { protect } from "../middleware/authMiddleware.ts";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiters.ts";

const router = Router();

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/me", protect as any, getMe as any);

export default router;
