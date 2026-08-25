import { Router } from "express";
import healthRoutes from "./healthRoutes";
import aiRoutes from "./aiRoutes";
import businessRoutes from "./businessRoutes";
import catalogRoutes from "./catalogRoutes";
import applicantRoutes from "./applicantRoutes";
import reportRoutes from "./reportRoutes";
import discoveryRoutes from "./discoveryRoutes";
import marketIntelligenceRoutes from "./marketIntelligenceRoutes";
import financialPlanRoutes from "./financialPlanRoutes";
import fieldObservationRoutes from "./fieldObservationRoutes";
import aiAdvisorRoutes from "./aiAdvisorRoutes";

const router = Router();

router.use(healthRoutes);
router.use(aiRoutes);
router.use(businessRoutes);
router.use(catalogRoutes);
router.use(applicantRoutes);
router.use(reportRoutes);
router.use(discoveryRoutes);
router.use(marketIntelligenceRoutes);
router.use(financialPlanRoutes);
router.use(fieldObservationRoutes);
router.use(aiAdvisorRoutes);

export default router;
