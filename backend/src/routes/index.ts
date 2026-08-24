import { Router } from "express";
import healthRoutes from "./healthRoutes";
import aiRoutes from "./aiRoutes";
import businessRoutes from "./businessRoutes";
import catalogRoutes from "./catalogRoutes";

const router = Router();

router.use(healthRoutes);
router.use(aiRoutes);
router.use(businessRoutes);
router.use(catalogRoutes);

export default router;
