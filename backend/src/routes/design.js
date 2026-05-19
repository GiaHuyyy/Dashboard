import { Router } from "express";

import {
  createDesignTask,
  deleteDesignTask,
  deleteDesignTasks,
  getDesignTaskById,
  listDesignReferences,
  listDesignTasks,
  updateDesignTask,
} from "../controllers/designController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listDesignTasks);
router.get("/references", authenticate, listDesignReferences);
router.delete("/", authenticate, deleteDesignTasks);
router.post("/", authenticate, createDesignTask);
router.get("/:id", authenticate, getDesignTaskById);
router.put("/:id", authenticate, updateDesignTask);
router.delete("/:id", authenticate, deleteDesignTask);

export default router;
