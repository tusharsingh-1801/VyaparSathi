import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { chat, listScenarios } from "../controllers/stressSimulatorController";

const router = Router();
router.get("/stress-simulator/scenarios", listScenarios);
router.post("/stress-simulator/chat", asyncHandler(chat));

export default router;
