import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { chat, insight } from "../controllers/aiAdvisorController";

const router = Router();
router.post("/ai-advisor/chat", asyncHandler(chat));
router.get("/ai-advisor/insight", asyncHandler(insight));

export default router;
