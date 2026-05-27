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
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.TEMPLATE_VIEW), listEmailTemplates);
router.delete("/", authenticate, requirePermission(PERMISSIONS.TEMPLATE_DELETE), deleteEmailTemplates);
router.post("/", authenticate, requirePermission(PERMISSIONS.TEMPLATE_CREATE), createEmailTemplate);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.TEMPLATE_VIEW), getEmailTemplateById);
router.put("/:id", authenticate, requireAnyPermission(PERMISSIONS.TEMPLATE_UPDATE, PERMISSIONS.TEMPLATE_SET_DEFAULT), updateEmailTemplate);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.TEMPLATE_DELETE), deleteEmailTemplate);

export default router;
