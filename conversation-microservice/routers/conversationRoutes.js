import express from "express";
import {
  individuallyMarkAsReadUnread,
  individuallyMarkAsStarredUnstarred,
  deleteIndividualConversation,
  deleteBulkConversations,
  markAsReadUnreadBulkConversations,
  markAsStarredUnstarredBulkConversations,
  viewConversation,
  getConversationList,
  // addConversationDummy,
} from "../controllers/conversationController.js";
import { authenticUserToAccessConversation } from "../middleware/authentication.js";

const router = express.Router();
// dummy api
// router.route("/conversation/dummy-add").post(authenticUserToAccessConversation, addConversationDummy)
// mark as read/unread individual
router
  .route("/conversation/mark-as-read-unread-individual/:conversationId")
  .put(authenticUserToAccessConversation, individuallyMarkAsReadUnread);

// mark as starred/unstarred individual
router
  .route("/conversation/mark-as-starred-unstarred-individual/:conversationId")
  .put(authenticUserToAccessConversation, individuallyMarkAsStarredUnstarred);

// Delete individual Conversation
router
  .route("/conversation/individual-delete/:conversationId")
  .delete(authenticUserToAccessConversation, deleteIndividualConversation);

// Delete Bulk Conversation
router
  .route("/conversation/bulk-delete")
  .put(authenticUserToAccessConversation, deleteBulkConversations);

// Mark as read/unread Bulk Conversation
router
  .route("/conversation/mark-as-read-unread")
  .put(authenticUserToAccessConversation, markAsReadUnreadBulkConversations);

// Mark as starred/unstarred Bulk Conversations
router
  .route("/conversation/mark-as-starred-unstarred")
  .put(
    authenticUserToAccessConversation,
    markAsStarredUnstarredBulkConversations
  );

// view conversation
router
  .route("/conversation/:conversationId")
  .get(authenticUserToAccessConversation, viewConversation);

// conversation list
router
  .route("/conversation")
  .get(authenticUserToAccessConversation, getConversationList);

export default router;
