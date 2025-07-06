import express from "express";
import multer from "multer";
import {
  createInboundParseEmail,
  getEmailHistoryList,
  sendEmailIndividual,
  updateEmailStatistics,
  viewEmailHistory,
  unsubscribeEmail,
} from "../controllers/sendEmailController.js";
import { cancelScheduledSend } from "../utils/createBatchIds.js";
import {
  cancelScheduledSMS,
  getSmsHistoryList,
  receiveSMS,
  sendSmsIndividual,
  updateSmsStatus,
  viewSmsHistory,
} from "../controllers/sendSmsController.js";

import { viewLatestAwsSqsMsg } from "../controllers/awsSqsController.js";
import { addBulkContactEmail } from "../controllers/bulkEmailContactController.js";
import { addBulkContactSms } from "../controllers/bulkSmsContactController.js";
import { authenticUserToAccessEmailSMSsending } from "../middleware/authentication.js";
import {
  availableNewPhoneNumbers,
  iso3166Alpha2Country,
  plivoNumberList,
  rentAPhoneNumber,
  unrentAPhoneNumber,
  viewPlivoNumberDetails,
} from "../controllers/plivoNumberController.js";

// Set up multer for handling multipart form data
const upload = multer();

const router = express.Router();
// Send Individual Email
router
  .route("/email-sms/individual-email")
  .post(authenticUserToAccessEmailSMSsending,sendEmailIndividual);

// Cancel Scheduled Email
router
  .route("/email-sms/cancel-schedule-email")
  .put(authenticUserToAccessEmailSMSsending, cancelScheduledSend);
// For Events Webhook.
router.route("/email-sms/webhook-events").post(updateEmailStatistics);
// For Inbound parse Webhook ( Not tested yet )
router
  .route("/email-sms/inbound-parse-webhook")
  .post(upload.any(), createInboundParseEmail);
// View Individual Email History
router
  .route("/email-sms/individual-email/:emailHistoryId")
  .get(authenticUserToAccessEmailSMSsending, viewEmailHistory);

// List of Individual Email History
router
  .route("/email-sms/individual-email")
  .get(authenticUserToAccessEmailSMSsending, getEmailHistoryList);
// Email unsubsribe
router
  .route("/email-sms/unsubscribe-email/:contactId")
  .get(unsubscribeEmail); 
// The routes are not tested because of Plivo auth_id & auth_token
// Send Individual SMS
router
  .route("/email-sms/individual-sms")
  .post(sendSmsIndividual);
// Update SMS Status
router.route("/email-sms/update-sms-status").post(updateSmsStatus);
// Receive an SMS
router.route("/email-sms/receive-sms").post(receiveSMS);

// Cancel Scheduled SMS
router
  .route("/email-sms/cancel-scheduled-sms")
  .post(authenticUserToAccessEmailSMSsending, cancelScheduledSMS);

// View SMS History
router
  .route("/email-sms/individual-sms/:smsHistoryId")
  .get(authenticUserToAccessEmailSMSsending, viewSmsHistory);

// List of SMS History
router
  .route("/email-sms/individual-sms")
  .get(authenticUserToAccessEmailSMSsending, getSmsHistoryList);

// Plivo number details
router
  .route("/email-sms/rented-numbers/:plivoNumber")
  .get(authenticUserToAccessEmailSMSsending, viewPlivoNumberDetails);

// List of Plivo Number
router
  .route("/email-sms/number-list")
  .get(authenticUserToAccessEmailSMSsending, plivoNumberList);

// ISO 3166 alpha-2 country code of the country
router.route("/email-sms/iso-3166-country-codes").get(iso3166Alpha2Country);
// Search for new Numbers
router
  .route("/email-sms/search-for-new-numbers")
  .get(authenticUserToAccessEmailSMSsending, availableNewPhoneNumbers);
// Buy a number
router
  .route("/email-sms/buy-number")
  .post(authenticUserToAccessEmailSMSsending, rentAPhoneNumber);
// Unrent a number
router
  .route("/email-sms/unrent-number")
  .put(authenticUserToAccessEmailSMSsending, unrentAPhoneNumber);

// Get latest message from AWS SQS
router
  .route("/email-sms/get-most-recent-message")
  .get(authenticUserToAccessEmailSMSsending, viewLatestAwsSqsMsg);

// post contact email data
router
  .route("/email-sms/add-contact-email")
  .post(authenticUserToAccessEmailSMSsending, addBulkContactEmail);

// post contact sms data
router
  .route("/email-sms/add-contact-sms")
  .post(authenticUserToAccessEmailSMSsending, addBulkContactSms);

export default router;
