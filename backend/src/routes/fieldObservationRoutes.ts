import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { list, submit } from "../controllers/fieldObservationController";

const router = Router();
router.post("/field-observations", asyncHandler(submit));
router.get("/field-observations", asyncHandler(list));

export default router;
