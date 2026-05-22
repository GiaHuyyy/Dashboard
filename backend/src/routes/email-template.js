import { Router } from "express";

import {
  createEmailTemplate,
  deleteEmailTemplate,
  deleteEmailTemplates,
  getEmailTemplateById,
  listEmailTemplates,
  updateEmailTemplate,
} from "../controllers/emailTemplateController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listEmailTemplates);
router.delete("/", authenticate, deleteEmailTemplates);
router.post("/", authenticate, createEmailTemplate);
router.get("/:id", authenticate, getEmailTemplateById);
router.put("/:id", authenticate, updateEmailTemplate);
router.delete("/:id", authenticate, deleteEmailTemplate);

export default router;
