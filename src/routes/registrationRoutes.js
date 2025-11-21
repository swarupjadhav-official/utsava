import express from "express";
import { registerForEvent, cancelRegistration } from "../controllers/registrationController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Register (guest or logged-in)
router.post("/events/:id/register", registerForEvent);

// Cancel registration (for logged-in users only)
router.post("/events/:id/cancel", requireAuth, cancelRegistration);

export default router;
