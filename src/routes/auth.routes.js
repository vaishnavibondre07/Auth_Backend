import { Router } from "express";
import { registerUser, loginUser, refreshToken, logoutUser, logoutAll, googleLogin, verifyEmail, resendOtp } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.get("/refresh-token", refreshToken);
authRouter.post("/logout", logoutUser);
authRouter.post("/logout-all", logoutAll);
authRouter.post("/google-login", googleLogin);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resend-otp", resendOtp);

export default authRouter;


