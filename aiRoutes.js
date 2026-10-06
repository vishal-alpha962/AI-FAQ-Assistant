import { Router } from "express";
import { askAssistant, generateFAQs } from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/generate", protect, generateFAQs);
router.post("/ask", askAssistant);

export default router;
