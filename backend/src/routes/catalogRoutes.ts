import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getCategories, getLocationSuggestions } from "../controllers/catalogController";

const router = Router();
router.get("/business/categories", asyncHandler(getCategories));
router.get("/locations/search", asyncHandler(getLocationSuggestions));

export default router;
