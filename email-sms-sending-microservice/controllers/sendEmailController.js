import sendGridMail from "@sendgrid/mail";
import asyncHandler from "express-async-handler";
import {
  convertReqFilesToAttachments,
  getEventKeyPayload,
  isInvalidEmailPayload,
} from "../utils/validateEmailPayload.js";
import dotEnv from "dotenv";
import EmailHistory from "../models/emailHistoryModel.js";
import Contact from "../models/contactModel.js";
import moment from "moment-timezone";
import { ObjectId } from "mongodb";
import { params } from "../utils/globalSqsMessage.js";
import { sqs } from "../utils/globalSqsMessage.js";
import {
  generateBatchId,
  generateCalystaproBatchId,
} from "../utils/createBatchIds.js";
import { generateEmailHistoryFilters } from "../utils/generateEmailHistoryFilters.js";
import Conversation from "../models/conversationModel.js";
import { removeUnnecessaryFields } from "../utils/validateSmsPayload.js";
import ExecutableWorkflow from "../models/executableWorkflowModel.js";
dotEnv.config(); // allow .env file to load
// will be updated when we enable sendgrid api key for individual organization
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailIndividual = asyncHandler(async (req, res) => {
  // console.log('alhamdulillah'); 
  // return;
  const errorMessage = isInvalidEmailPayload(req.body);
  if (errorMessage) {
    // if the payload is invalid
    // send an error message
    return res.status(400).json({ message: errorMessage });
  }

  const { to, from, subject, content, attachments, send_at, conversation_id } =
    req.body;

  try {
    // get the unix Send at value
    const sendAt = getGMTEpochTime({
      send_at,
    });
    // Search for recipient
    const recipient = await Contact.findOne({
      email: to.email,
    //  organization_id: req.user.organization_id,
      is_deleted: false,
    }); 
    if (!recipient) {
      // if no recipient found with to  email address
      return res
        .status(404)
        .json({ message: "No contact found with this email address." });
    }

    if (recipient.dnd_email == true) { 
      // if dnd_email true for the recipient email
      return res
        .status(404)
        .json({ message: "The email sending option has been disabled for this email address." });
    }

    // Add an unsubscribe link to the email content
    const unsubscribeLink = `${process.env.CALYSTA_PRO_API_URL}/api/email-sms/unsubscribe-email/${recipient.id}`;
    req.body.content[0].value += `<p><br>Click <a href="${unsubscribeLink}">here</a> to unsubscribe</p>`; 

    // Check if scheduling is more than 72 hours in advance
    const now = moment();
    const sendAtMoment = moment(send_at);
    const diffInHours = sendAtMoment.diff(now, "hours");
    if (process.env.SHOULD_SENDGRID_HANDLE_SCHEDULING && diffInHours < 72) {
      const calystaproBatchId = generateCalystaproBatchId();
      // creating the Email history instance
      const scheduledEmailHistory = new EmailHistory({
        organization_id: req.user.organization_id,
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
        to,
        from,
        subject,
        content,
        attachments,
        batch_id: calystaproBatchId,
        send_at: new Date(sendAt * 1000),
        is_tried: false,
        is_sent: false,
        created_at: moment().tz("Etc/UTC"),
        updated_at: moment().tz("Etc/UTC"),
      });
      // save Email history into DB
      const savedScheduledEmailHistory = await scheduledEmailHistory.save();

      let current_status = "sent"; 
      
      if (conversation_id) {
        // Find conversation ( if any )
        const conversation = await Conversation.findById(conversation_id);

        if (conversation) {
          // if any conversation exists, get the whole conversation list
          let conversationList = JSON.parse(
            JSON.stringify(conversation.conversations)
          );
          // new item
          const newItem = {
            organization_id: req.user.organization_id,
            inbound: false,
            channel: "email",
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
            to,
            from,
            subject,
            content,
            attachments,
            send_at: new Date(sendAt * 1000),
            batch_id: calystaproBatchId,
            current_status,
          };

          //add new item to the conversation
          conversationList.push(newItem);
          // Replace the conversations with the update one
          const sendAtDate = new Date(sendAt * 1000);
          await Conversation.findByIdAndUpdate(conversation_id, {
            conversations: conversationList,
            last_message: subject,
            last_message_date: sendAtDate,
            is_read: false,
            updated_at: moment().tz("Etc/UTC"), 
          });
        }
      }

      return res
        .status(200)
        .json({
          message: "Email Scheduled successfully.",
          data: savedScheduledEmailHistory,
        });
    }

    // Frontend code to get the user's timezone
    //  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // console.log('User timezone:', userTimezone);

    let batchId;
    let current_status = "sent";

    const msg = {
      to,
      from,
      subject,
      content,
      attachments,
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false,
        },
        openTracking: {
          enable: true,
          substitutionTag: "%open-track%",
        },
        subscriptionTracking: {
          enable: true,
        },
      },
    };

    if (send_at) {
      const send_at_date = moment(send_at);
      if (!send_at_date.isBefore(now)) {
        // if send_at_date is not in the past
        // Create a batch id;
        batchId = await generateBatchId();
        current_status = "scheduled";
      }

      msg.send_at = sendAt;
      // include batch ID
      if (batchId) msg.batch_id = batchId;
    }
    // Send the email
    const sentResult = await sendGridMail.send(msg);
    // console.log({ sentResult });  only statusCode, headers
    // pick the send-grid message id from the headers
    const messageId =
      sentResult && sentResult.length > 0
        ? sentResult[0]?.headers["x-message-id"]
        : undefined;
    const sendAtDate = new Date(sendAt * 1000);
    // creating the Email history instance
    const emailHistory = new EmailHistory({
      organization_id: req.user.organization_id,
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
      to,
      from,
      subject,
      content,
      attachments,
      send_at: sendAtDate,
      batch_id: batchId,
      sg_message_id: messageId,
      is_tried: true,
      is_sent: false,
      created_at: moment().tz("Etc/UTC"),
      updated_at: moment().tz("Etc/UTC"),
    });
    // save Email history into DB
    const savedEmailHistory = await emailHistory.save();

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
          organization_id: req.user.organization_id,
          inbound: false,
          channel: "email",
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
          to,
          from,
          subject,
          content,
          attachments,
          send_at: sendAtDate,
          batch_id: batchId,
          current_status,
          sg_message_id: messageId,
          _id: objectId,
        };

        //add new item to the conversation
        conversationList.push(newItem);
        // Replace the conversations with the update one
        await Conversation.findByIdAndUpdate(conversation_id, {
          conversations: conversationList,
          last_message: subject,
          last_message_date: sendAtDate,
          is_read: false,
          updated_at: moment().tz("Etc/UTC"),
        });

        // sqs email Object
        const sqsMessageObject = {
          organizationId: req.user.organization_id,
          from: to,
          to: from,
          subject: subject,
          content: content,
          inbound: false,
          channel: "email",
          threadId: objectId,
          received_at: new Date(),
        };

        // post data to aws sqs
        await sqs
          .sendMessage({
            ...params,
            MessageBody: JSON.stringify(sqsMessageObject),
          })
          .promise();
      }
    }

    return res
      .status(200)
      .json({ message: "Email sent successfully.", data: savedEmailHistory });
  } catch (err) {
    console.log(
      "Error from sendEmailIndividual:",
      err,
      err?.response?.body?.errors
    );
    if (err.code === 400) {
      return res.status(400).json({ message: "Email payload is invalid." });
    } else {
      return res.status(500).json({ message: "Somthing went wrong." });
    }
  }
});

// Helper function to get the send_at value
export const getGMTEpochTime = ({ send_at }) => {
  let time = send_at ? moment.tz(send_at, "Etc/UTC") : moment().tz("Etc/UTC");
  // Convert the Time to Unix time
  const unixTime = time.unix();
  return unixTime;
};

/// View an EmailHistory
const viewEmailHistory = asyncHandler(async (req, res) => {
  const emailHistoryId = req.params.emailHistoryId;
  try {
    // Find requested Email History
    const emailHistory = await EmailHistory.findById(emailHistoryId);
    if (!emailHistory) {
      // if no Email history found
      return res.status(404).json({ message: "Email History not found." });
    }

    if (emailHistory.organization_id != req.user.organization_id) {
      // If a view request is made for different organization's Email History
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }

    return res
      .status(200)
      .json({ message: "Email history details", data: emailHistory });
  } catch (err) {
    console.log("Error from viewEmailHistory:", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// List of EmailHistory
const getEmailHistoryList = asyncHandler(async (req, res) => {
  const page = req?.query?.page ? Number(req.query.page) : 1; // Page number (starting from 1)
  const limit = req?.query?.limit ? Number(req.query.limit) : 10; // Number of documents per page
  const sortBy = req?.query?.sort_by ? req.query.sort_by : "-created_at"; // by default Created At descending order.
  const search = req?.query?.search ? req.query.search : "";
  const filters = generateEmailHistoryFilters(req.query);

  // filter by organization id
  filters.organization_id = req.user.organization_id;
  // console.log(filters);

  // Create a regular expression for wildcard search
  const regex = new RegExp(`.*${search}.*`, "i"); // "i" for case-insensitive search

  // Calculate the skip value based on the page size and number
  const skip = (page - 1) * limit;
  try {
    const query = EmailHistory.find({
      $and: [
        {
          $or: [
            { "to.email": { $regex: regex } },
            { "to.name": { $regex: regex } },
            { "from.email": { $regex: regex } },
            { "from.name": { $regex: regex } },
            { subject: { $regex: regex } },
          ],
        },
        filters,
      ],
    })
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    // execute emailHistory Query
    const emailHistories = await query.exec();
    // Getting the Total Document Count
    const totalCount = await EmailHistory.countDocuments(query.getFilter());

    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };
    res.status(200).json({
      message: "Email history list",
      data: emailHistories,
      paginationData,
    });
  } catch (err) {
    console.log("Error form getEmailHistoryList:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// update Email statistics via webhook
const updateEmailStatistics = asyncHandler(async (req, res) => {
  // get the events sorted by timestamp ascending
  const events = req.body.sort((a, b) => a.timestamp - b.timestamp);
  // get the last event
  const lastEvent = events[events.length - 1];
  // find the send grid message id
  const messageId = lastEvent.sg_message_id.includes(".")
    ? lastEvent.sg_message_id.split(".")[0]
    : lastEvent.sg_message_id;
  // get proper statistics payload
  const eventKeyPayload = getEventKeyPayload(lastEvent);

  try {
    const statusUpdatePayload = {
      statistics: eventKeyPayload,
      current_status: lastEvent.event,
      updated_at: moment().tz("Etc/UTC"),
    };

    if (lastEvent.event === "delivered") {
      statusUpdatePayload.is_sent = true;
    }

    // update requested email history with statistics and status
    await EmailHistory.findOneAndUpdate(
      {
        sg_message_id: messageId,
      },
      statusUpdatePayload
    );
    // Find conversation ( if any )
    const conversation = await Conversation.findOne({
      "conversations.sg_message_id": messageId,
    });

    if (conversation) {
      // if any conversation exists, get the whole conversation list
      let conversationList = JSON.parse(
        JSON.stringify(conversation.conversations)
      );
      // find the requested item index
      const requestedItemIndex = conversationList.findIndex(
        (item) => item.sg_message_id === messageId
      );

      // update requested item current status
      conversationList[requestedItemIndex].current_status = lastEvent.event;
      // Replace the conversations with the update one
      await Conversation.findOneAndUpdate(
        {
          "conversations.sg_message_id": messageId,
        },
        {
          conversations: conversationList,
          updated_at: moment().tz("Etc/UTC"),
        }
      );
    }

    return res.status(200).json({ message: "Email statistics updated." });
  } catch (error) {
    console.log("Error from updateEmailStatistics:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// get Inbound parsed Email from Sendgrid
const createInboundParseEmail = asyncHandler(async (req, res) => {
  try {
    // Access the fields in the multipart form data
    const fields = req.body;

    const inReplyToMatch = fields["headers"].match(/References:\s<([^>]*)>/i);
    const inReplyToValue = inReplyToMatch ? inReplyToMatch[1] : null;

    const messageId = inReplyToValue.split("@")[0];
    // Find the previous mail
    const previousMail = await EmailHistory.findOne({
      sg_message_id: messageId,
    });
    // console.log({ previousMail });

    // If no mail found with the id, we don't have an option to start conversation.
    if (!previousMail) {
      return res.status(404).json({ message: "No previous mail found." });
    }

    const receivedAt = getGMTEpochTime({});
    const receivedAtDate = new Date(receivedAt * 1000);

    const attachments = convertReqFilesToAttachments(req.files);

    // creating the Email history instance
    const emailHistory = new EmailHistory({
      organization_id: previousMail.organization_id,
      inbound: true,
      recipient: {
        recipient_id: previousMail?.sender?.sender_id,
        first_name: previousMail?.sender?.first_name,
        is_active: previousMail?.sender?.is_active,
        profile_pic_url: previousMail?.sender?.profile_pic_url ?? undefined,
      },
      sender: {
        sender_id: previousMail?.recipient?.recipient_id,
        first_name: previousMail?.recipient?.first_name,
      },
      to: previousMail.from,
      from: previousMail.to,
      subject: fields.subject,
      content: [
        {
          type: "text/html",
          value: fields.html,
        },
      ],
      attachments: attachments,
      current_status: "received",
      received_at: receivedAtDate,
      is_tried: true,
      is_sent: false,
      created_at: moment().tz("Etc/UTC"),
      updated_at: moment().tz("Etc/UTC"),
    });

    // save Email history into DB
    const savedEmailHistory = await emailHistory.save();
    savedEmailHistory.channel = "email";

    // Find conversation ( if any )
    const conversation = await Conversation.findOne({
      contact_id: previousMail?.recipient?.recipient_id,
    });

    if (conversation) {
      // if any conversation exists, get the whole conversation list
      let conversationList = JSON.parse(
        JSON.stringify(conversation.conversations)
      );

      // Remove Unnecessary properties
      const newThread = removeUnnecessaryFields(
        ["_id", "created_at", "updated_at"],
        savedEmailHistory
      );

      // push the new item to the conversation list
      conversationList.push(newThread);

      // sqs email Object
      const sqsMessageObject = {
        organizationId: conversation?.organization_id,
        from: previousMail?.to,
        to: previousMail?.from,
        subject: fields.subject,
        content: [
          {
            type: "text/html",
            value: fields.html,
          },
        ],
        inbound: true,
        threadId: conversation?._id,
        channel: "email",
        received_at: new Date(),
      };

      // post data to aws sqs
      await sqs
        .sendMessage({
          ...params,
          MessageBody: JSON.stringify(sqsMessageObject),
        })
        .promise();

      // console.log({ conversationList });
      // Replace the conversations with the update one
      const updatedConversation = await Conversation.findOneAndUpdate(
        {
          contact_id: previousMail?.recipient?.recipient_id,
        },
        {
          conversations: conversationList,
          last_message: fields.subject,
          last_message_date: receivedAtDate,
          is_read: false,
          updated_at: moment().tz("Etc/UTC"),
        }
      );
      await updatedConversation.save();
    } else {
      // Remove Unnecessary properties
      const oldThread = removeUnnecessaryFields(
        ["_id", "created_at", "updated_at"],
        previousMail
      );
      const newThread = removeUnnecessaryFields(
        ["_id", "created_at", "updated_at"],
        savedEmailHistory
      );

      const newConversation = new Conversation({
        organization_id: previousMail.organization_id,
        contact_id: previousMail.recipient?.recipient_id,
        contact_email: previousMail.to.email,
        last_message: fields.subject,
        last_message_date: receivedAtDate,
        conversations: [oldThread, newThread],
        created_at: moment().tz("Etc/UTC"),
        updated_at: moment().tz("Etc/UTC"),
      });

      const savedNewConversation = await newConversation.save();
      // update Contact conversation_id
      await Contact.findByIdAndUpdate(previousMail?.recipient?.recipient_id, {
        conversation_id: savedNewConversation._id,
        updated_at: moment().tz("Etc/UTC"),
      });

      // new addition 27-02-24
      const executableWorkflow = await ExecutableWorkflow.find({
        sg_message_id: messageId,
      });

      if (executableWorkflow) {
        await sendEmailToObservers(
          executableWorkflow.observers,
          {
            first_name: previousMail?.recipient?.first_name,
            email: previousMail.to.email,
          },
          "email"
        );
      }
      // End of else
    }

    return res.status(200).json({ message: "Email processed." });
  } catch (error) {
    console.log("Error from createInboundParseEmail: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// new addition 27-02-24
const getFormatedObserversTo = (observers) => {
  const result = [];
  for (let observer of observers) {
    result.push({
      email: observer,
    });
  }

  return result;
};

// send email to our observers
export const sendEmailToObservers = async (observers, contact, channel) => {

  const unsubscribeLink = `${process.env.CALYSTA_PRO_API_URL}/api/email-sms/unsubscribe-email/${contact.id}`;

  const to = getFormatedObserversTo(observers);
  const message = {
    personalizations: [
      {
        to,
      },
    ],
    from: {
      email: process.env.OBSERVER_FROM_EMAIL,
      name: process.env.OBSERVER_FROM_NAME,
    },
    subject: `New Customer Reply: ${contact?.first_name}-${
      channel === "email" ? contact?.email : contact?.phone
    }`,
    content: [
      {
        type: "text/html",
        value: `<p>Hi there!</p><br /><p>You have received a new reply from a CRM customer <br/><strong>Customer: ${
          contact?.first_name
        }</strong>, <br /><strong>Customer contact: ${
          channel === "email" ? contact?.email : contact?.phone
        }</strong>.</p>
        <br/> <p>To view the reply and the entire conversation history, please log in to the CRM system and navigate to the specific conversation</p><br/>
        <p><strong>Please note:</strong> This is an automated notification. Please do not reply directly to this email.</p>
        <p>Thank you,</p>
        <p>Calystapro CRM Team<p/>
        <p><br>Click <a href="${unsubscribeLink}">here</a> to unsubscribe</p>
        `
      }
    ],
  };

  await sendGridMail.send(message);

} 

const unsubscribeEmail = asyncHandler(async (req, res) => {
  
  const contactId = req.params.contactId;

  try {
    // Check if the contact exists
    const existingContact = await Contact.findById(contactId);
    
    if (!existingContact) {
      console.error('Contact not found.');
      return res.status(404).json({ message: 'Contact not found.' });
    }

    // Check if dnd_email is already true
    if (existingContact.dnd_email) {
      return res.status(200).json({ message: 'This email is already unsubscribed' });
    }

    // Update dnd_email to true
    existingContact.dnd_email = true;
    existingContact.updated_at = moment().tz('Etc/UTC');
    
    await existingContact.save();

    return res.status(200).json({ message: 'Unsubscribed successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});



export {
  sendEmailIndividual,
  viewEmailHistory,
  getEmailHistoryList,
  updateEmailStatistics,
  createInboundParseEmail,
  unsubscribeEmail,
};
