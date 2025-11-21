import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";

/* -------------------------------------------------------
   🟢 REGISTER FOR EVENT (guest + logged-in)
------------------------------------------------------- */
export const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).send("Event not found.");
    if (!event.isApproved)
      return res.status(403).send("Event not available for registration yet.");

    // Prevent past event registration
    if (new Date(event.startDate) < new Date()) {
      return res.status(400).send("This event has already occurred.");
    }

    // Capacity check
    const regCount = await Registration.countDocuments({ eventId });
    if (event.capacity && regCount >= event.capacity) {
      return res.status(400).send("Sorry, this event is full.");
    }

    /* ---------------- Logged-in Registration ---------------- */
    if (req.user) {
      const existing = await Registration.findOne({
        eventId,
        attendeeId: req.user._id,
      });
      if (existing)
        return res.redirect(`/events/${event.slug}?registered=1`);

      const reg = new Registration({
        eventId,
        attendeeId: req.user._id,
      });
      await reg.save();

      console.log(`✅ Registered user ${req.user.email} for ${event.title}`);
      return res.redirect(`/events/${event.slug}?success=1`);
    }

    /* ---------------- Guest Registration ---------------- */
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).send("Name and email are required.");

    const existingGuest = await Registration.findOne({
      eventId,
      "attendeeInfo.email": email.toLowerCase().trim(),
    });
    if (existingGuest)
      return res.redirect(`/events/${event.slug}?already=1`);

    const reg = new Registration({
      eventId,
      attendeeInfo: { name: name.trim(), email: email.toLowerCase().trim() },
    });
    await reg.save();

    console.log(`✅ Guest registered: ${email} for ${event.title}`);
    return res.redirect(`/events/${event.slug}?success=1`);
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).send("Internal server error during registration.");
  }
};

/* -------------------------------------------------------
   🔴 CANCEL REGISTRATION (logged-in only)
------------------------------------------------------- */
export const cancelRegistration = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const eventId = req.params.id;
    const reg = await Registration.findOne({
      eventId,
      attendeeId: req.user._id,
      isCancelled: false,
    });

    if (!reg)
      return res.status(404).send("Registration not found.");

    reg.isCancelled = true;
    await reg.save();

    console.log(`⚠️ Registration cancelled for event ${eventId}`);
    return res.redirect("/attendee/registrations");
  } catch (err) {
    console.error("❌ Cancel registration error:", err);
    res.status(500).send("Internal server error.");
  }
};

