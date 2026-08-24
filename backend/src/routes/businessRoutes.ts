import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validateAnalyzeRequest } from "../middleware/validateAnalyzeRequest";
import { analyze } from "../controllers/businessController";

const router = Router();
router.post("/business/analyze", validateAnalyzeRequest, asyncHandler(analyze));

export default router;
