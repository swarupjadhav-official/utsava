import User from "../models/User.js";

/**
 * 🧩 Middleware: requireAuth
 * Ensures a user is logged in and attaches user info to req + res.locals
 */
export const requireAuth = async (req, res, next) => {
  try {
    const userId = req.cookies.userId;

    // 🚫 No cookie = not logged in
    if (!userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId);

    // 🚫 Invalid / deleted user
    if (!user) {
      res.clearCookie("userId");
      return res.redirect("/login");
    }

    // ✅ Attach user data globally
    req.user = user;
    res.locals.user = user;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).send("Internal authentication error.");
  }
};
