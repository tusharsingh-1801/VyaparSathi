import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { recommendations, schemes } from "../controllers/discoveryController";

const router = Router();
router.get("/discovery/recommendations", asyncHandler(recommendations));
router.get("/discovery/schemes", asyncHandler(schemes));

export default router;
