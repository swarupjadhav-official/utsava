// src/utils/cloudinary.js
import dotenv from "dotenv";
dotenv.config(); // 🔑 make sure .env is loaded here

import { v2 as cloudinary } from "cloudinary";

// (optional) debug – 2–3 baar test karke baad me hata dena
console.log("Cloudinary ENV check:", {
  name: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
  secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;