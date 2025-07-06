import express from "express";
import {
  addTagsToBulkContacts,
  changePipelineStageToBulkContacts,
  deleteBulkContacts,
  removeTagsToBulkContacts,
  restoreBulkContacts,
  starBulkContacts,
  unstarBulkContacts,
} from "../controllers/bulkContactController.js";
import { authenticUserToAccessBulkContact } from "../middleware/authentication.js";

const router = express.Router();

router
  .route("/bulk-contact-action/delete")
  .put(authenticUserToAccessBulkContact, deleteBulkContacts);
router
  .route("/bulk-contact-action/restore")
  .put(authenticUserToAccessBulkContact, restoreBulkContacts);
router
  .route("/bulk-contact-action/star")
  .put(authenticUserToAccessBulkContact, starBulkContacts);
router
  .route("/bulk-contact-action/remove-star")
  .put(authenticUserToAccessBulkContact, unstarBulkContacts);
router
  .route("/bulk-contact-action/add-tag")
  .put(authenticUserToAccessBulkContact, addTagsToBulkContacts);
router
  .route("/bulk-contact-action/remove-tag")
  .put(authenticUserToAccessBulkContact, removeTagsToBulkContacts);

// router
//   .route("/bulk-contact-action/update-pipeline-stage")
//   .put(authenticUserToAccessBulkContact, changePipelineStageToBulkContacts);

export default router;
