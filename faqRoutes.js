import { Router } from "express";
import {
  createFAQ,
  deleteFAQ,
  getFAQ,
  getFAQs,
  semanticSearch,
  textSearch,
  updateFAQ
} from "../controllers/faqController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", getFAQs);
router.get("/search", textSearch);
router.get("/semantic-search", semanticSearch);
router.get("/:id", getFAQ);

router.post("/", protect, createFAQ);
router.put("/:id", protect, updateFAQ);
router.delete("/:id", protect, deleteFAQ);

export default router;
