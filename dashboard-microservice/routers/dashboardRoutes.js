import express from "express";

import { authenticUserToAccessDashboard } from "../middleware/authentication.js";
import {
  getDashboardInsight,
  getSourceWiseOpportunityReport,
  getOpportunitiesCountGroupByStatus,
  getOpportunitiesValueGroupByStatus,
} from "../controllers/dashboardController.js";

const router = express.Router();
// Dashboard routes
router
  .route("/dashboard/insight")
  .get(authenticUserToAccessDashboard, getDashboardInsight);

router
  .route("/dashboard/opportunities")
  .get(authenticUserToAccessDashboard, getOpportunitiesCountGroupByStatus);

router
  .route("/dashboard/pipeline-value")
  .get(authenticUserToAccessDashboard, getOpportunitiesValueGroupByStatus);

router
  .route("/dashboard/source-report")
  .get(authenticUserToAccessDashboard, getSourceWiseOpportunityReport);

export default router;
