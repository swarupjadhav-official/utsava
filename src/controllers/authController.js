import bcrypt from "bcryptjs";
import User from "../models/User.js";

/* -------------------------------------------------------
   🟢 SIGNUP CONTROLLER
------------------------------------------------------- */
export const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).send("User already exists. Please log in.");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Everyone starts as attendee
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "attendee",
    });

    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Server error during signup.");
  }
};

/* -------------------------------------------------------
   🟠 LOGIN CONTROLLER
------------------------------------------------------- */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found.");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send("Invalid password.");

    // Ensure role always valid
    const allowedRoles = ["attendee", "organiser", "admin"];
    if (!allowedRoles.includes(user.role)) {
      user.role = "attendee";
      await user.save();
    }

    // Set cookie and redirect
    res.cookie("userId", user._id, { httpOnly: true });

    // Everyone lands on home page after login
    return res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error during login.");
  }
};

/* -------------------------------------------------------
   🔴 LOGOUT CONTROLLER
------------------------------------------------------- */
export const logoutUser = (req, res) => {
  res.clearCookie("userId");
  res.redirect("/");
};
