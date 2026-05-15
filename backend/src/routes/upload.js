import { Router } from "express";
import multer from "multer";
import authenticate from "../middleware/authenticate.js";
import { uploadContractImage } from "../controllers/uploadController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)"));
    }
    cb(null, true);
  },
});

router.post("/", authenticate, upload.single("file"), uploadContractImage);

export default router;
