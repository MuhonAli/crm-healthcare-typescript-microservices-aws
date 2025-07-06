import asyncHandler from "express-async-handler";
import plivo from "plivo";
import dotEnv from "dotenv";
import moment from "moment-timezone";
import { ObjectId } from 'mongodb';
import SMSHistory from "../models/smsHistoryModel.js";
import {
  addPlusSignIfNeeded,
  formatedSMSHistoryToConversationList,
  isInvalidSMSPayload,
  isInvalidScheduleCancelPayload,
  isInvalidateIncomingStatus,
  removeUnnecessaryFields,
} from "../utils/validateSmsPayload.js";
import { generateSMSHistoryFilters } from "../utils/generateSmsHistoryFilter.js";
import { getGMTEpochTime, sendEmailToObservers } from "./sendEmailController.js";
import Conversation from "../models/conversationModel.js";
import Contact from "../models/contactModel.js";
import { sqs } from "../utils/globalSqsMessage.js";
import { params } from "../utils/globalSqsMessage.js";
import ExecutableWorkflow from "../models/executableWorkflowModel.js";
import { calystaproSign, generateCalystaproBatchId } from "../utils/createBatchIds.js";
dotEnv.config(); // allow .env file to load
const callbackUrl =
  process.env.CALYSTA_PRO_API_URL + "/api/email-sms/update-sms-status";
const plivoClient = new plivo.Client(
  process.env.PLIVO_AUTH_ID,
  process.env.PLIVO_AUTH_TOKEN
);

// Send Sms Individual
const sendSmsIndividual = asyncHandler(async (req, res) => {
  // Validate request payload
  const errorMessage = isInvalidSMSPayload(req.body);
  if (errorMessage) {
    // if the payload is invalid, return 400
    return res.status(400).json({ message: errorMessage });
  }
  const { dst, text, src, send_at, conversation_id } = req.body;

  try {
    // Search for recipient
    const recipient = await Contact.findOne({
      phone: dst,
     // organization_id: req.user.organization_id,
      is_deleted: false,
    });
 
    if (!recipient) {
      // if no recipient found with to  phone number
      return res
        .status(404)
        .json({ message: "No contact found with this phone number." });
    }

    if (recipient.dnd_sms == true) { 
      // if dnd_email true for the recipient email
      return res.status(404).json({ message: "The SMS sending option has been disabled for this phone number." });
    }

      // Search for recipient in SMS History 
      const checkSmsHistory = await SMSHistory.findOne({
        dst: dst,
      });

      if (!checkSmsHistory) {
        req.body.text += "\nTo stop receiving messages, reply with STOP. To restart SMS service, reply with START.";
      }
    // get the unix Send at value
    const sendAt = getGMTEpochTime({
      send_at,
    });
    let plivoResponse;
    if (!send_at) {
      // Send SMS to the destination number with the provided text and callback URL.
      plivoResponse = await plivoClient.messages.create({
        src,
        dst,
        text,
        type: "sms",
        url: callbackUrl,
        method: "POST",
      });
    }

    // console.log({ plivoResponse });

    const sendAtDate = new Date(sendAt * 1000);

    // Creating a new instance
    const smsHistory = new SMSHistory({
      src,
      dst,
      text,
      type: "sms",
      inbound: false,
      recipient: {
        recipient_id: recipient._id,
        first_name: recipient.first_name,
      },
      sender: {
        sender_id: req.user.id,
        first_name: req.user.first_name,
        is_active: req.user.is_active,
        profile_pic_url: req.user?.profile_pic_url ?? undefined,
      },
      send_at: sendAtDate,
      is_scheduled: send_at ? true : false,
      pli_message_uuid: plivoResponse
        ? plivoResponse.messageUuid[0]
        : undefined,
      organization_id: req.user.organization_id,
      current_status: "queued",
      is_tried: send_at ? false : true,
      is_sent: false,
      batch_id: send_at ? generateCalystaproBatchId() : undefined,
      created_at: moment().tz("Etc/UTC"),
      updated_at: moment().tz("Etc/UTC"),
    });
    // Saving the instance to the database
    const savedSmsHistory = await smsHistory.save();

    if (conversation_id) {
      // Find conversation ( if any )
      const conversation = await Conversation.findById(conversation_id);

      if (conversation) {
        // if any conversation exists, get the whole conversation list
        let conversationList = JSON.parse(
          JSON.stringify(conversation.conversations)
        );

        // new object id
        const objectId = new ObjectId();

        // new item
        const newItem = {
          src,
          dst,
          text,
          channel: "sms",
          inbound: false,
          recipient: {
            recipient_id: recipient._id,
            first_name: recipient.first_name,
          },
          sender: {
            sender_id: req.user.id,
            first_name: req.user.first_name,
            isActive: req.user.isActive,
            profile_pic_url: req.user?.profile_pic_url ?? undefined,
          },
          send_at: sendAtDate,
          pli_message_uuid: plivoResponse
            ? plivoResponse.messageUuid[0]
            : undefined,
          organization_id: req.user.organization_id,
          current_status: "queued",
          batch_id: send_at ? generateCalystaproBatchId() : undefined,
          is_scheduled: send_at ? true : false,
          _id: objectId,
        };


        // sqsMessageObject
        const sqsMessageObject = {
          organizationId:req.user.organization_id,
          from:src,
          to:dst,
          text:text,
          inbound:false,
          channel:"sms",
          threadId: objectId,
          received_at: new Date(),
          recipient: {
            recipient_id: recipient._id,
            first_name: recipient.first_name,
          },
          sender: {
            sender_id: req.user.id,
            first_name: req.user.first_name,
            isActive: req.user.isActive,
            profile_pic_url: req.user?.profile_pic_url ?? undefined,
          },
          received_at: new Date(),
        }

        // post data to aws sqs
        await sqs.sendMessage({
          ...params,
          MessageBody: JSON.stringify(sqsMessageObject),
        }).promise();

        //add new item to the conversation
        conversationList.push(newItem);
        // Replace the conversations with the update one
        await Conversation.findByIdAndUpdate(conversation_id, {
          conversations: conversationList,
          last_message: text.slice(0, 56) + "...",
          last_message_date: sendAtDate,
          is_read: false,
          updated_at: moment().tz("Etc/UTC"),
        });
      }
    }

    return res
      .status(200)
      .json({ message: "Message sent successfully", data: savedSmsHistory });
  } catch (err) {
    console.log("Error for sendSmsIndividual: ", err);
    return res.status(500).json("Internal Server Error");
  }
});

/// View an SmsHistory
const viewSmsHistory = asyncHandler(async (req, res) => {
  const smsHistoryId = req.params.smsHistoryId;
  try {
    const smsHistory = await SMSHistory.findById(smsHistoryId);
    if (!smsHistory) {
      // if no sms history found
      return res.status(404).json({ message: "Sms history not found." });
    }

    if (smsHistory.organization_id != req.user.organization_id) {
      // If a view request is made for different organization's SMS History
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }

    return res
      .status(200)
      .json({ message: "Sms history details", data: smsHistory });
  } catch (err) {
    console.log("Error from viewSmsHistory:", err);
    return res.status(404).json({ message: "Sms history not found." });
  }
});

// List of SmsHistory
const getSmsHistoryList = asyncHandler(async (req, res) => {
  const page = req?.query?.page ? Number(req.query.page) : 1; // Page number (starting from 1)
  const limit = req?.query?.limit ? Number(req.query.limit) : 10; // Number of documents per page
  const sortBy = req?.query?.sort_by ? req.query.sort_by : "-created_at"; // by default Created At descending order.
  const search = req?.query?.search ? req.query.search : "";
  // Generate filter queries based on the request query
  const filters = generateSMSHistoryFilters(req.query);
  // Create a regular expression for wildcard search
  const regex = new RegExp(`.*${search}.*`, "i"); // "i" for case-insensitive search
  // console.log(filters);
  // Calculate the skip value based on the page size and number
  const skip = (page - 1) * limit;
  try {
    const query = SMSHistory.find({
      $and: [
        {
          $or: [
            { src: { $regex: regex } },
            { dst: { $regex: regex } },
            { text: { $regex: regex } },
          ],
        },
        filters,
      ],
    })
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    // execute smsHistory Query
    const smsHistories = await query.exec();
    // Getting the Total Document Count
    const totalCount = await SMSHistory.countDocuments(query.getFilter());

    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };
    res.status(200).json({
      message: "Sms history list",
      data: smsHistories,
      paginationData,
    });
  } catch (err) {
    console.log("Error form getSmsHistoryList:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Update SMS Status
const updateSmsStatus = asyncHandler(async (req, res) => {
  const plivoRequestPayload = req.body;

  // console.log({ plivoRequestPayload });
  // find the sent SMS in the DB
  const foundSms = await SMSHistory.findOne({
    pli_message_uuid: plivoRequestPayload.MessageUUID,
  });

  if (!foundSms) {
    res.status(404).json({ message: "Sms history not found." });
  }
  // validate incoming Plivo Status
  const errorMessage = isInvalidateIncomingStatus(
    foundSms.current_status,
    plivoRequestPayload.Status
  );
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {

    const statusUpdatePayload = {
      current_status: plivoRequestPayload?.Status,
      updated_at: moment().tz("Etc/UTC"),
    }
    if (plivoRequestPayload.Status === "sent") {
      statusUpdatePayload.is_sent = true;
    }
    // update incoming status our DB
    await SMSHistory.findOneAndUpdate(
      {
        // pli_message_uuid: plivoRequestPayload.message_uuid, // in the docs
        pli_message_uuid: plivoRequestPayload.MessageUUID, // in individual msg response.
      },
      statusUpdatePayload,
      { new: true }
    );

    // Find conversation ( if any )
    const conversation = await Conversation.findOne({
      "conversations.pli_message_uuid": plivoRequestPayload.MessageUUID,
    });

    if (conversation) {
      // if any conversation exists, get the whole conversation list
      let conversationList = JSON.parse(
        JSON.stringify(conversation.conversations)
      );
      // find the requested item index
      const requestedItemIndex = conversationList.findIndex(
        (item) => item.pli_message_uuid == plivoRequestPayload.MessageUUID
      );

      // update requested item current status
      conversationList[requestedItemIndex].current_status =
        plivoRequestPayload?.Status;
      // Replace the conversations with the update one
      await Conversation.findOneAndUpdate(
        {
          "conversations.pli_message_uuid": plivoRequestPayload.MessageUUID,
        },
        {
          conversations: conversationList,
          updated_at: moment().tz("Etc/UTC"),
        }
      );
    }

    return res.status(200).json({ message: "Sms history updated" });
  } catch (err) {
    console.log("Error updateSmsStatus:", err);
    return res.status(500).json({ message: "Internal Server Error." });
  }
});

// Signature validation
const isTheRequestSignatureValid = (req) => {
  const signature = req.get("X-Plivo-Signature-V2");
  const nonce = req.get("X-Plivo-Signature-V2-Nonce");
  const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;

  return plivo.validateSignature(
    fullUrl,
    nonce,
    signature,
    process.env.PLIVO_AUTH_TOKEN
  );
};

// Receive a SMS
const receiveSMS = asyncHandler(async (req, res) => {
  try {
    // Validate Plivo Signature
    const requestValidity = isTheRequestSignatureValid(req);
    // console.log({ requestValidity });
    if (!requestValidity) {
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }
    // Getting the necessary field from the request body
    const from_number = addPlusSignIfNeeded(req.body?.From);
    const to_number = addPlusSignIfNeeded(req.body?.To);
    const text = req.body?.Text;
    const type = req.body?.Type;
    const messageId = req.body?.MessageUUID;
    const receivedAt = getGMTEpochTime({});
    const receivedAtDate = new Date(receivedAt * 1000);

    // Find the previous SMS by send_at descending order
    const previousSMSs = await SMSHistory.find({
      dst: from_number,
      src: to_number,
      send_at: { $lt: receivedAtDate },
    })
      .sort("-send_at")
      .exec();

    // If no SMS found with the id, we don't have an option to start conversation.
    if (!previousSMSs || previousSMSs.length === 0) {
      return res.status(404).json({ message: "No previous SMS found." });
    }
    // get the last SMS
    const prevSMS = previousSMSs[0];

    // creating the sms history instance
    const smsHistory = new SMSHistory({
      organization_id: prevSMS.organization_id,
      inbound: true,
      recipient: {
        recipient_id: prevSMS?.sender?.sender_id,
        first_name: prevSMS?.sender?.first_name,
        is_active: prevSMS?.sender?.is_active,
        profile_pic_url: prevSMS?.sender?.profile_pic_url ?? undefined,
      },
      sender: {
        sender_id: prevSMS?.recipient?.recipient_id,
        first_name: prevSMS?.recipient?.first_name,
      },
      src: from_number,
      dst: to_number,
      text: text,
      type,
      pli_message_uuid: messageId,
      current_status: "received",
      received_at: receivedAtDate,
      is_tried: true,
      is_sent: false,
      created_at: moment().tz("Etc/UTC"),
      updated_at: moment().tz("Etc/UTC"),
    });

    // save Email history into DB
    const savedSmsHistory = await smsHistory.save();
    savedSmsHistory.channel = type; // set the channel for conversation

    // Find conversation ( if any )
    const conversation = await Conversation.findOne({
      contact_id: prevSMS?.recipient?.recipient_id,
      // "conversations.pli_message_uuid": prevSMS.pli_message_uuid,
    });

    if (conversation) {
      // if any conversation exists, get the whole conversation list
      let conversationList = JSON.parse(
        JSON.stringify(conversation.conversations)
      );
      // Remove Unnecessary properties
      const newThread = removeUnnecessaryFields(
        ["_id", "created_at", "updated_at"],
        savedSmsHistory
      );
      // push the new item to the conversation list
      conversationList.push(newThread);
      // Replace the conversations with the update one
      await Conversation.findOneAndUpdate(
        {
          contact_id: prevSMS?.recipient?.recipient_id,
          // "conversations.sg_message_id": prevSMS.pli_message_uuid,
        },
        {
          conversations: conversationList,
          last_message: text.slice(0, 56) + "...",
          last_message_date: receivedAtDate,
          is_read: false,
          updated_at: moment().tz("Etc/UTC"),
        }
      );
      // sqs Message Object
      const sqsMessageObject = {
        organizationId: conversation?.organization_id,
        from: from_number,
        to:to_number,
        text:text,
        inbound:true,
        channel:"sms",
        threadId: conversation?._id,
        received_at: new Date(),
      }
      // post data to aws sqs
      await sqs.sendMessage({
        ...params,
        MessageBody: JSON.stringify(sqsMessageObject),
      }).promise();
    } else {
      const threads = formatedSMSHistoryToConversationList(
        previousSMSs,
        savedSmsHistory
      );

      const newConversation = new Conversation({
        organization_id: prevSMS.organization_id,
        contact_id: prevSMS.recipient?.recipient_id,
        contact_phone_number: from_number,
        last_message: text.slice(0, 56) + "...",
        last_message_date: receivedAtDate,
        conversations: threads,
        created_at: moment().tz("Etc/UTC"),
        updated_at: moment().tz("Etc/UTC"),
      });

      const savedNewConversation = await newConversation.save();
      // update Contact conversation_id
      await Contact.findByIdUpdate(prevSMS?.recipient?.recipient_id, {
        conversation_id: savedNewConversation._id,
        updated_at: moment().tz("Etc/UTC"),
      });

      // new addition 27-02-24
      const executableWorkflow = await ExecutableWorkflow.find({
        pli_message_uuid: messageId
      })

      if (executableWorkflow) {
        await sendEmailToObservers(executableWorkflow.observers, {
          first_name: prevSMS?.recipient?.first_name,
          phone: from_number,
        }, "sms")
      }
    }

    return res.status(200).json({ message: "SMS recieved." });
  } catch (err) {
    console.log("Error from receiveSMS: ", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Cancel Schedule
const cancelScheduledSMS = asyncHandler(async (req, res) => {
  const { batch_id } = req.body;
  if (!batch_id || typeof batch_id !== "string" || !batch_id.startsWith(calystaproSign)) {
    return res.status(400).json({ message: "Invalid Batch id" });
  }

  try {


    const foundSMSHistory = await SMSHistory.findOne({
      batch_id
    });

    if (!foundSMSHistory) {
      // if no SMS history found
      return res.status(404).json({ message: "No SMS history found." });
    }

    if (foundSMSHistory.organization_id != req.user.organization_id) {
      // If a cancel request is made for different organization's SMS History
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }

    await SMSHistory.findByIdAndUpdate(foundSMSHistory._id, {
      is_scheduled: false,
      canceled_schedule: true,
      current_status: "canceled",
      canceled_schedule_by: req.user.id,
      updated_at: moment().tz("Etc/UTC"),
    });


    // Find conversation ( if any )
    const conversation = await Conversation.findOne({
      "conversations.batch_id": batch_id,
    });

    if (conversation) {
      // if any conversation exists, get the whole conversation list
      let conversationList = JSON.parse(
        JSON.stringify(conversation.conversations)
      );
      // Remove Unnecessary properties
      const threadIndex = conversationList.findIndex(
        (item) => item.batch_id === batch_id
      );
      if (threadIndex >= 0) {
        conversationList[threadIndex].is_scheduled = false;
        conversationList[threadIndex].current_status = "canceled";
        conversationList[threadIndex].canceled_schedule = true;
        conversationList[threadIndex].canceled_schedule_by = req.user.id;
        // Replace the conversations with the update one
        await Conversation.findByIdAndUpdate(conversation._id, {
          conversations: conversationList,
          updated_at: moment().tz("Etc/UTC"),
        });
      }
    }

    return res
      .status(200)
      .json({ messages: "The scheduled task has been successfully removed." });
  } catch (err) {
    console.log("Error from cancelScheduledSMS: ", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export {
  sendSmsIndividual,
  viewSmsHistory,
  getSmsHistoryList,
  updateSmsStatus,
  receiveSMS,
  cancelScheduledSMS,
};
