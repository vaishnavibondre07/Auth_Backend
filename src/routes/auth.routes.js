import { Router } from "express";
import { registerUser, loginUser, refreshToken, logoutUser } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.get("/refresh-token", refreshToken);
authRouter.post("/logout", logoutUser);

export default authRouter;