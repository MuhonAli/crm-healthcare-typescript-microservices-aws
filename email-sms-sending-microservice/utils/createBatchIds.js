import sendGridClient from "@sendgrid/client";
import asyncHandler from "express-async-handler";
import EmailHistory from "../models/emailHistoryModel.js";
import moment from "moment-timezone";
import dotEnv from "dotenv";
import { v4 as uuidv4 } from 'uuid';
import Conversation from "../models/conversationModel.js";
dotEnv.config(); // allow .env file to load
// will be updated when we enable sendgrid api key for individual organization
sendGridClient.setApiKey(process.env.SENDGRID_API_KEY);

export const calystaproSign = "CALYSTA-PRO"

export const generateCalystaproBatchId = () => {
  return calystaproSign + uuidv4()
}

export const generateBatchId = async () => {
  const createBatchRequest = {
    url: `/v3/mail/batch`,
    method: "POST",
  };

  try {
    const [response, body] = await sendGridClient.request(createBatchRequest);
    return body.batch_id;
  } catch (e) {
    console.log("Error from generateBatchId: ", e);
    return null;
  }
};

// Cancel Scheduled Send
export const cancelScheduledSend = asyncHandler(async (req, res) => {
  // Getting batch Id from body
  const { batch_id } = req.body;

  try {
    if (batch_id && typeof batch_id === "string") {

      if (!batch_id.startsWith(calystaproSign)) {
        const cancelBatchRequest = {
          url: `/v3/user/scheduled_sends`,
          method: "POST",
          body: JSON.stringify({
            batch_id,
            status: "cancel",
          }),
        };
        // Cancel schedule from send grid
        await sendGridClient.request(cancelBatchRequest);
      }
      // update Email history with cancelled status
      await EmailHistory.updateMany(
        { batch_id: batch_id },
        {
          statistics: {
            processed: false,
            delivered: false,
            opened: false,
            clicked: false,
            soft_bounced: false,
            hard_bounced: false,
            unsubscribed: false,
            failed: false,
            spamed: false,
            replied: false,
            canceled_schedule: true,
            canceled_schedule_by: req.user.id,
          },
          current_status: "canceled",
          updated_at: moment().tz("Etc/UTC"),
        }
      );

      // Find conversation ( if any )
      const conversation = await Conversation.findOne({
        "conversations.batch_id": batch_id,
      });

      if (conversation) {
        // if any conversation exists, get the whole conversation list
        let conversationList = JSON.parse(
          JSON.stringify(conversation.conversations)
        );
        // find the requested item index
        const requestedItemIndex = conversationList.findIndex(
          (item) => item.batch_id === batch_id
        );

        // update requested item current status
        conversationList[requestedItemIndex].current_status = "canceled";
        // Replace the conversations with the update one
        await Conversation.findOneAndUpdate(
          {
            "conversations.batch_id": batch_id,
          },
          {
            conversations: conversationList,
            updated_at: moment().tz("Etc/UTC"),
          }
        );
      }
      return res.status(200).json({ message: "Schedule cancelled" });
    }


    return res.status(400).json({ message: "Invalid batch Id" });
  } catch (error) {
    console.log(
      "Error from cancelScheduledSend",
      error,
      error?.response?.body?.errors
    );

    if (error.response.body.errors) {
      return res
        .status(400)
        .json({ message: error.response.body.errors[0].message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
