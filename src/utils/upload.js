import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Setup base path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../public/uploads");

// ✅ Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created uploads folder:", uploadDir);
}

// ✅ Multer Storage Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName.replace(/\s+/g, "-").toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

// ✅ File Filter (supports Safari/HEIC/PNG/JPG/WEBP)
const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/heic",
    "image/heif",
    "image/webp",
  ];

  if (!allowed.includes(file.mimetype)) {
    console.warn("⚠️ File rejected (type):", file.mimetype);
    req.fileValidationError =
      "Only image files (JPEG, PNG, WEBP, or HEIC) are allowed.";
    return cb(null, false);
  }

  cb(null, true);
};

// ✅ Initialize Multer with larger limit + safer error handling
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 🔼 increased to 10 MB max
  },
});

// ✅ Debug helper (optional)
export const checkUploadMiddleware = (req, res, next) => {
  console.log("🧩 Upload Debug - Content-Type:", req.headers["content-type"]);
  next();
};
