import { Router } from "express";

import { getProfile } from "../controllers/profile.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const profileRouter = Router();

profileRouter.get("/profile", authMiddleware, getProfile);

export default profileRouter;