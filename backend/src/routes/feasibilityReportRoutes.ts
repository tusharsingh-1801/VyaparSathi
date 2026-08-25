import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { generate, getOne, list } from "../controllers/feasibilityReportController";

const router = Router();
router.post("/feasibility-report/generate", asyncHandler(generate));
router.get("/feasibility-report/:id", asyncHandler(getOne));
router.get("/feasibility-report", asyncHandler(list));

export default router;
