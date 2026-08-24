import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { create, getOne, update } from "../controllers/applicantController";

const router = Router();
router.post("/applicants", asyncHandler(create));
router.get("/applicants/:id", asyncHandler(getOne));
router.patch("/applicants/:id", asyncHandler(update));

export default router;
