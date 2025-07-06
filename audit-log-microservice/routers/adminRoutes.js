import express from "express";
import {
  identifyRequestUserForAuditLog,
} from "../middleware/authentication.js";

import {
  getGeneralAuditLogs
} from "../controllers/generalAuditController.js";

const router = express.Router();


// For get api of get general audit logs
router
  .route("/audit/get-general-audit-logs")
  .get(identifyRequestUserForAuditLog, getGeneralAuditLogs);


export default router;
