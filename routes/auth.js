import express from "express";

const router = express.Router();

// middleware
import { requireSignin } from "../middlewares";

// controllers
import {
    register,
    login,
    logout,
    currentUser,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    agreeToTermsAndCondition,
    settings,
    currentUserForSideNav,
    setParentMode,
    setTimeOutDisabled,
    getCurrentParent,
    registerAdminToChatEngine
} from "../controllers/auth";

router.post("/register", register);
router.post("/register-admin-to-chatengine", registerAdminToChatEngine)
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requireSignin, currentUser);
router.get("/current-userNavbar", requireSignin, currentUserForSideNav)
router.get("/getCurrent-user", requireSignin, getCurrentUser)
router.get("/getCurrent-parent", requireSignin, getCurrentParent)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/terms-and-condition/:id", agreeToTermsAndCondition)
router.put("/setSettings/:id", settings)
router.put("/setParentMode", setParentMode)
router.put("/setTimeOutEnabled/:id", setTimeOutDisabled)

module.exports = router;
