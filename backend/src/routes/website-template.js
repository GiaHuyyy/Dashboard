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

const router = Router();

router.get("/", authenticate, requirePermission("websiteTemplate.view"), listWebsiteTemplates);
router.delete("/", authenticate, requirePermission("websiteTemplate.delete"), deleteWebsiteTemplates);
router.post("/", authenticate, requirePermission("websiteTemplate.create"), createWebsiteTemplate);
router.get("/:id", authenticate, requirePermission("websiteTemplate.view"), getWebsiteTemplateById);
router.put("/:id", authenticate, requirePermission("websiteTemplate.update"), updateWebsiteTemplate);
router.delete("/:id", authenticate, requirePermission("websiteTemplate.delete"), deleteWebsiteTemplate);

export default router;
