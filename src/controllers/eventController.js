import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import slugify from "slugify";
import fs from "fs";
import path from "path";

/* -------------------------------------------------------
   🌍 PUBLIC: VIEW ALL APPROVED EVENTS (with organiser view)
------------------------------------------------------- */
export const listApprovedEvents = async (req, res) => {
  try {
    const filter = { isApproved: true };
    if (req.user && req.user.role === "organiser") {
      filter.$or = [{ isApproved: true }, { organiserId: req.user._id }];
      delete filter.isApproved;
    }

    const events = await Event.find(filter).sort({ date: 1 });
    res.render("pages/explore_events", { user: req.user, events });
  } catch (err) {
    console.error("Error fetching approved events:", err);
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   🟢 CREATE NEW EVENT (with hostedBy + timezone fix)
------------------------------------------------------- */
export const createEvent = async (req, res) => {
  console.log("✅ CREATE EVENT ROUTE HIT");

  try {
    if (req.fileValidationError) return res.status(400).send(req.fileValidationError);
    if (!req.file && !req.body.image) return res.status(400).send("Please upload an image.");

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      capacity,
      ticketType,
      price,
      hostedBy
    } = req.body;

    if (!title || !description || !startDate || !location || !hostedBy) {
      return res.status(400).send("All required fields must be filled.");
    }

    // ✅ Parse datetime-local safely as local time (no timezone offset)
    function parseLocalDateTime(dtString) {
      if (!dtString) return null;
      const [datePart, timePart] = dtString.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);
      return new Date(year, month - 1, day, hour, minute);
    }

    const parsedStart = parseLocalDateTime(startDate);
    const parsedEnd = parseLocalDateTime(endDate);

    if (parsedEnd && parsedEnd.getTime() < parsedStart.getTime()) {
      console.log("⚠️ Invalid time order:", parsedStart, parsedEnd);
      return res.status(400).send("End date/time cannot be earlier than start date/time.");
    }

    const numericCapacity = capacity ? Number(capacity) : 0;
    const numericPrice = ticketType === "paid" ? Number(price) : 0;

    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;
    while (await Event.findOne({ slug })) slug = `${baseSlug}-${count++}`;

    let imageUrl = "";
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;

    const newEvent = new Event({
      title,
      slug,
      description,
      date: parsedStart,
      startDate: parsedStart,
      endDate: parsedEnd,
      location,
      capacity: numericCapacity,
      ticketType: ticketType || "free",
      price: numericPrice,
      image: imageUrl,
      hostedBy,
      organiserId: req.user._id,
      isApproved: false,
    });

    await newEvent.save();
    console.log("🎉 Event created successfully:", newEvent.title);
    return res.redirect("/events/dashboard");
  } catch (err) {
    console.error("❌ Event creation error:", err);
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).send("Image too large. Please upload a file under 10 MB.");
    res.status(500).send("Internal server error while creating event.");
  }
};

/* -------------------------------------------------------
   📋 VIEW ALL EVENTS BY ORGANISER
------------------------------------------------------- */
export const listOrganiserEvents = async (req, res) => {
  try {
    const events = await Event.find({ organiserId: req.user._id }).sort({ createdAt: -1 });
    const now = new Date();
    const eventsUpcoming = events.filter(e => new Date(e.date) >= now);
    const eventsPast = events.filter(e => new Date(e.date) < now);
    res.render("pages/dashboard", { user: req.user, eventsUpcoming, eventsPast });
  } catch (err) {
    console.error("Error fetching organiser events:", err);
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   ✏️ EDIT EVENT
------------------------------------------------------- */
export const editEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found.");
    if (event.organiserId.toString() !== req.user._id.toString()) return res.status(403).send("Unauthorized.");
    res.render("pages/edit_event", { user: req.user, event });
  } catch (err) {
    console.error("Error loading edit page:", err);
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   🔄 UPDATE EVENT (with hostedBy + timezone fix)
------------------------------------------------------- */
export const updateEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      capacity,
      price,
      ticketType,
      hostedBy,
    } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found.");
    if (event.organiserId.toString() !== req.user._id.toString()) return res.status(403).send("Unauthorized.");

    // ✅ Parse datetime-local safely as local time
    function parseLocalDateTime(dtString) {
      if (!dtString) return null;
      const [datePart, timePart] = dtString.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);
      return new Date(year, month - 1, day, hour, minute);
    }

    const parsedStart = parseLocalDateTime(startDate);
    const parsedEnd = parseLocalDateTime(endDate);
    if (parsedEnd && parsedEnd.getTime() < parsedStart.getTime())
      return res.status(400).send("End date/time cannot be earlier than start date/time.");

    event.title = title;
    event.description = description;
    event.date = parsedStart || event.date;
    event.startDate = parsedStart || event.startDate;
    event.endDate = parsedEnd || event.endDate;
    event.location = location;
    event.hostedBy = hostedBy;
    event.capacity = capacity ? Number(capacity) : 0;
    event.ticketType = ticketType;
    event.price = ticketType === "paid" ? Number(price) : 0;

    if (req.file) {
      if (event.image && event.image.startsWith("/uploads/")) {
        const imgPath = path.join(process.cwd(), "public", event.image);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
      event.image = `/uploads/${req.file.filename}`;
    }

    await event.save();
    res.redirect("/events/dashboard");
  } catch (err) {
    console.error("Update error:", err);
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).send("Image too large. Please upload a file under 10 MB.");
    res.status(500).send("Internal server error.");
  }
};

/* -------------------------------------------------------
   ❌ DELETE EVENT (with full cleanup)
------------------------------------------------------- */
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found.");
    if (event.organiserId.toString() !== req.user._id.toString()) return res.status(403).send("Unauthorized access.");

    await Registration.deleteMany({ eventId: event._id });
    if (event.image && event.image.startsWith("/uploads/")) {
      const imgPath = path.join(process.cwd(), "public", event.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await event.deleteOne();
    console.log(`🗑️ Event deleted: ${event.title}`);
    res.redirect("/events/dashboard");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Internal server error during event deletion.");
  }
};

/* -------------------------------------------------------
   🟣 VIEW EVENT DETAILS BY SLUG
------------------------------------------------------- */
export const showEventBySlug = async (req, res) => {
  try {
    const query = { slug: req.params.slug };
    if (!req.user || req.user.role !== "organiser") query.isApproved = true;

    const event = await Event.findOne(query);
    if (!event) return res.status(404).send("Event not found.");

    let registered = false;
    if (req.user) {
      const exists = await Registration.findOne({
        eventId: event._id,
        attendeeId: req.user._id,
      });
      registered = !!exists;
    }

    const regCount = await Registration.countDocuments({ eventId: event._id });
    const capacityLeft = event.capacity ? Math.max(0, event.capacity - regCount) : null;

    res.render("pages/event_detail", {
      user: req.user,
      event,
      registered,
      regCount,
      capacityLeft,
      query: req.query,
    });
  } catch (err) {
    console.error("Show event error:", err);
    res.status(500).send("Internal server error.");
  }
};