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
import requirePermission, { requireAnyPermission } from "../middleware/requirePermission.js";

const router = Router();

router.get("/", authenticate, requirePermission("template.view"), listEmailTemplates);
router.delete("/", authenticate, requirePermission("template.delete"), deleteEmailTemplates);
router.post("/", authenticate, requirePermission("template.create"), createEmailTemplate);
router.get("/:id", authenticate, requirePermission("template.view"), getEmailTemplateById);
router.put("/:id", authenticate, requireAnyPermission("template.update", "template.setDefault"), updateEmailTemplate);
router.delete("/:id", authenticate, requirePermission("template.delete"), deleteEmailTemplate);

export default router;
