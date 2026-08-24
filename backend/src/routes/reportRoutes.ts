import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getOne, list } from "../controllers/reportController";

const router = Router();
router.get("/reports", asyncHandler(list));
router.get("/reports/:id", asyncHandler(getOne));

export default router;
