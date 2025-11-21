// src/controllers/adminController.js
import Event from "../models/Event.js";
import User from "../models/User.js";
import Registration from "../models/Registration.js";

/* -------------------------------------------------------
   🧩 Admin Dashboard
------------------------------------------------------- */
export const adminDashboard = async (req, res) => {
  try {
    const pendingEvents = await Event.find({ isApproved: false }).populate("organiserId");
    const approvedEvents = await Event.find({ isApproved: true }).populate("organiserId");
    const organisers = await User.find({ role: "organiser" });

    res.render("pages/admin_dashboard", {
      user: req.user,
      pendingEvents,
      approvedEvents,
      organisers,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   ✅ Approve Event
------------------------------------------------------- */
export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found.");
    event.isApproved = true;
    await event.save();
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Approve event error:", err);
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   ❌ Reject Event
------------------------------------------------------- */
export const rejectEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found.");
    await event.deleteOne();
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Reject event error:", err);
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   🧩 Approve Organiser
------------------------------------------------------- */
export const approveOrganiser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found.");
    user.role = "organiser";
    await user.save();
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Approve organiser error:", err);
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   ❌ Remove Organiser
------------------------------------------------------- */
export const removeOrganiser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found.");
    user.role = "attendee";
    await user.save();
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Remove organiser error:", err);
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   📊 Admin Analytics
------------------------------------------------------- */
export const adminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const organisers = await User.countDocuments({ role: "organiser" });
    const admins = await User.countDocuments({ role: "admin" });
    const totalEvents = await Event.countDocuments();
    const approvedEvents = await Event.countDocuments({ isApproved: true });
    const registrations = await Registration.countDocuments();

    res.render("pages/admin_analytics", {
      user: req.user,
      totalUsers,
      organisers,
      admins,
      totalEvents,
      approvedEvents,
      registrations,
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   📤 Export CSV
------------------------------------------------------- */
export const exportRegistrationsCSV = async (req, res) => {
  try {
    const regs = await Registration.find().populate("eventId attendeeId");

    const formatted = regs.map(r => ({
      Event: r.eventId?.title || "Deleted Event",
      AttendeeName: r.attendeeInfo?.name || r.attendeeId?.name || "Unknown",
      AttendeeEmail: r.attendeeInfo?.email || r.attendeeId?.email || "N/A",
      Date: new Date(r.createdAt).toLocaleString(),
    }));

    // ✅ For ESM environments
    const { Parser } = await import("json2csv");
    const parser = new Parser({ fields: ["Event", "AttendeeName", "AttendeeEmail", "Date"] });
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("utsava_registrations.csv");
    res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).send("Internal server error.");
  }
};
