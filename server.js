import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import connectDB from "./src/utils/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import registrationRoutes from "./src/routes/registrationRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js"; // ✅ Added admin routes
import User from "./src/models/User.js"; // ✅ for global middleware

dotenv.config();

// ✅ Define logo URL (env first, fallback to Cloudinary URL)
const UTSAVA_LOGO_URL =
  process.env.UTSAVA_LOGO_URL ||
  "https://res.cloudinary.com/dhl5wzz6q/image/upload/v1763920233/utsava-logo_ew4wwt.png";

connectDB();

const app = express();

// ✅ Make available in ALL EJS views
app.locals.UTSAVA_LOGO_URL = UTSAVA_LOGO_URL;

// ---------- Path Setup ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Core Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Global User Middleware ----------
app.use(async (req, res, next) => {
  try {
    const userId = req.cookies.userId;
    if (userId) {
      const user = await User.findById(userId);
      res.locals.user = user;
      req.user = user;
    } else {
      res.locals.user = null;
      req.user = null;
    }
  } catch (err) {
    console.error("User middleware error:", err);
    res.locals.user = null;
    req.user = null;
  }
  next();
});

// ---------- View Engine ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------- Routes ----------
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);
app.use("/", registrationRoutes);
app.use("/admin", adminRoutes); // ✅ CHANGED → Mount admin routes properly

// ---------- Basic Pages ----------
app.get("/", (req, res) => res.render("pages/index"));
app.get("/login", (req, res) => res.render("pages/login"));
app.get("/signup", (req, res) => res.render("pages/signup"));

// ✅ Redirect old route /explore → /events
app.get("/explore", (req, res) => res.redirect("/events"));

// ---------- 404 Fallback ----------
app.use((req, res) => res.status(404).send("404 - Page Not Found"));

// ---------- Server Listen ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});