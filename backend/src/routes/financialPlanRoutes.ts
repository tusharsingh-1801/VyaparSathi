import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createPlan } from "../controllers/financialPlanController";

const router = Router();
router.post("/business/financial-plan", asyncHandler(createPlan));

export default router;
