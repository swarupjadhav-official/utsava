import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    attendeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // for logged-in users
    },
    attendeeInfo: {
      name: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
    },
    isCancelled: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// optional: prevent duplicate guest registration for same event/email
registrationSchema.index({ eventId: 1, "attendeeInfo.email": 1 }, { unique: false });

export default mongoose.model("Registration", registrationSchema);
