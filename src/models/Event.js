import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    unique: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  location: {
    type: String,
    required: true,
  },

  // 🆕 NEW FIELD: Hosted By
  hostedBy: {
    type: String,
    required: true,
    trim: true,
  },

  capacity: {
    type: Number,
    default: 0,
  },
  ticketType: {
    type: String,
    enum: ["free", "paid"],
    default: "free",
  },
  price: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    default: "",
  },
  organiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Event", eventSchema);