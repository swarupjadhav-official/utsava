// src/utils/upload.js
import dotenv from "dotenv";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

// ✅ Load .env here so env vars are ready BEFORE cloudinary.config
dotenv.config();

// ✅ Cloudinary config (values come from .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// (Optional) Quick debug — remove after it works
console.log("Cloudinary init:", {
  name: process.env.CLOUDINARY_CLOUD_NAME,
  key:  process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
  sec:  process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING",
});

// ✅ Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "utsava-events",          // folder in Cloudinary
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        {
          width: 1280,
          height: 720,
          crop: "fill",
          gravity: "auto",
        },
      ],
    };
  },
});

// ✅ Multer instance (10 MB limit)
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});