import express from "express";
import {
  createEvent,
  listOrganiserEvents,
  editEvent,
  updateEvent,
  deleteEvent,
  listApprovedEvents,
  showEventBySlug, // ✅ Added import here
} from "../controllers/eventController.js";

import { requireAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

/* -------------------------------------------------------
   🌍 PUBLIC: View all approved events
------------------------------------------------------- */
router.get("/", listApprovedEvents);

/* -------------------------------------------------------
   🧑‍💼 ORGANISER DASHBOARD
------------------------------------------------------- */
router.get("/dashboard", requireAuth, listOrganiserEvents);

/* -------------------------------------------------------
   ➕ CREATE EVENT
------------------------------------------------------- */
router.get("/create", requireAuth, (req, res) =>
  res.render("pages/create_event", { user: req.user })
);

// ✅ Multer runs BEFORE requireAuth for multipart parsing
router.post("/create", upload.single("image"), requireAuth, createEvent);

/* -------------------------------------------------------
   ✏️ EDIT EVENT
------------------------------------------------------- */
router.get("/edit/:id", requireAuth, editEvent);
router.post("/edit/:id", upload.single("image"), requireAuth, updateEvent);

/* -------------------------------------------------------
   ❌ DELETE EVENT
------------------------------------------------------- */
router.post("/delete/:id", requireAuth, deleteEvent);

/* -------------------------------------------------------
   🔍 EVENT DETAILS (Public)
   Support both: /events/event/:slug  and  /events/:slug
------------------------------------------------------- */
router.get("/event/:slug", showEventBySlug); // long form
router.get("/:slug", showEventBySlug);       // short clean URL

export default router;
