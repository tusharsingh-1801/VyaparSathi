import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { testAI } from "../controllers/aiController";

const router = Router();
router.get("/ai/test", asyncHandler(testAI));

export default router;
