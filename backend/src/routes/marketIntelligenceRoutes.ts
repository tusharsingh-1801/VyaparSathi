import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getIntelligence } from "../controllers/marketIntelligenceController";

const router = Router();
router.get("/market-intelligence", asyncHandler(getIntelligence));

export default router;
