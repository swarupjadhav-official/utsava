// src/routes/adminRoutes.js
import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import {
  adminDashboard,
  approveEvent,
  rejectEvent,
  approveOrganiser,
  removeOrganiser,
  adminAnalytics,
  exportRegistrationsCSV
} from "../controllers/adminController.js";

const router = express.Router();

/* -------------------------------------------------------
   🧠 Admin Routes (clean and consistent)
------------------------------------------------------- */
router.get("/dashboard", requireAuth, requireAdmin, adminDashboard);
router.post("/events/:id/approve", requireAuth, requireAdmin, approveEvent);
router.post("/events/:id/reject", requireAuth, requireAdmin, rejectEvent);
router.post("/users/:id/approve", requireAuth, requireAdmin, approveOrganiser);
router.post("/users/:id/remove", requireAuth, requireAdmin, removeOrganiser);
router.get("/analytics", requireAuth, requireAdmin, adminAnalytics);
router.get("/export", requireAuth, requireAdmin, exportRegistrationsCSV);

export default router;