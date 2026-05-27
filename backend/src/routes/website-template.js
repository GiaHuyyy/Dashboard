import { Router } from "express";

import {
  createWebsiteTemplate,
  deleteWebsiteTemplate,
  deleteWebsiteTemplates,
  getWebsiteTemplateById,
  listWebsiteTemplates,
  updateWebsiteTemplate,
} from "../controllers/websiteTemplateController.js";
import authenticate from "../middleware/authenticate.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", authenticate, requirePermission(PERMISSIONS.WEBSITE_TEMPLATE_VIEW), listWebsiteTemplates);
router.delete("/", authenticate, requirePermission(PERMISSIONS.WEBSITE_TEMPLATE_DELETE), deleteWebsiteTemplates);
router.post("/", authenticate, requirePermission(PERMISSIONS.WEBSITE_TEMPLATE_CREATE), createWebsiteTemplate);
router.get("/:id", authenticate, requirePermission(PERMISSIONS.WEBSITE_TEMPLATE_VIEW), getWebsiteTemplateById);
router.put("/:id", authenticate, requirePermission(PERMISSIONS.WEBSITE_TEMPLATE_UPDATE), updateWebsiteTemplate);
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.WEBSITE_TEMPLATE_DELETE), deleteWebsiteTemplate);

export default router;
