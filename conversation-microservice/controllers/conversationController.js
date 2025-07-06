import dotEnv from "dotenv";
import asyncHandler from "express-async-handler";
import moment from "moment-timezone";
import Conversation from "../models/conversationModel.js";
import {
  convertToNumberOrDefault,
  isBoolean,
} from "../utils/validateConversation.js";
dotEnv.config(); // allow .env file to load

// dummy add conversation 
// export const addConversationDummy = asyncHandler(async (req, res) => {
//   try {

//     const newConversation = new Conversation({
//       organization_id: req.user.organization_id,
//       contact_id: "65b3298bb5174ac4052e178b",
//       contact_email: "michael.Starc@sample.com",
//       last_message: "Hey starc!",
//       last_message_date: moment().tz("Etc/UTC"),
//       conversations: [
//         {
//           inbound: false,
//           sender: {
//             sender_id: "65af93de72fcfca6771647f4",
//             first_name: "Tuhin",
//             is_active: true,
//             profile_pic_url: "example.com/profile_photo.png"
//           },
//           recipient: {
//             recipient_id: "65b3298bb5174ac4052e178b",
//             first_name: "Michael",
//             is_active: true,
//           },
//           channel: "email",
//           send_at: moment().tz("Etc/UTC"),
//           current_status: "opened",

//           sg_message_id: "O107IlZvQ1GMjAqujW-k6A",
//           to: {
//             email: "michael.Starc@sample.com",
//             name: "Michael Starc",
//           },
//           from: {
//             email: "calystapro@parse.sjinnovation.info",
//             name: "Calystapro",
//           },
//           subject: "No subject",
//           content: [
//             {
//               type: "text/html",
//               value: "<p>Dear Sharf,</p></br><p>I hope this email finds you in good health and high spirits. We are writing to confirm your recent order for an RC Stunt Car from amazon Shop.</p></br><strong>Order Details</strong><ul><li>Order Number: #12548</li><li>Product: RC Stunt Car</li><li>Ouantity: 1</li><li>Total Amount: BDT 2299</li></ul></br></br><p>Your order is currently being processed, and we will notify you once it is ready for shipping. If you have any specific preferences or additional instructions regarding your order, please feel free to let us know, and we will do our best to accommodate them.</p></br></br><p>Thank you for choosing amazon Shop for your RC Stunt Car purchase.</p></br><p>Best regards</p></br><p>Customer Service Team</p></br><p>amazon Shop</p></br><p>Email: shop.amazon@amazonelectronics.com</p><p>Phone:  01973-102030</p>"
//             }
//           ],

//         },
//       ],
//     })

//     const savedConversation = await newConversation.save()
//     return res.status(201).json({ message: "Conversation created", data: savedConversation })
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ message: "Internal server error." })
//   }
// })


// mark as read/unread (individual)
const individuallyMarkAsReadUnread = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  const isRead = req.body.is_read;
  if (!isBoolean(isRead)) {
    return res.status(400).json({
      message: "The isRead flag must be set to either true or false.",
    });
  }

  try {
    const foundConversation = await Conversation.findById(conversationId);
    if (!foundConversation) {
      // if no conversation found
      return res.status(404).json({ message: "No conversation found." });
    }

    if (req.user.organization_id != foundConversation.organization_id) {
      // If a view request is made for different organization's conversation
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }

    if (foundConversation.is_read === isRead) {
      // if the conversation read status is already updated.
      return res
        .status(400)
        .json({ message: `Already marked as ${isRead ? "read" : "unread"}` });
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      is_read: isRead,
      updated_at: moment().tz("Etc/UTC"),
    });

    return res.status(200).json({
      message: `Successfully marked as ${isRead ? "read" : "unread"}.`,
    });
  } catch (err) {
    console.log("Error from individuallyMarkAsReadUnread: ", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// mark as Starred/Unstarred (individual)
const individuallyMarkAsStarredUnstarred = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  const isStarred = req.body.is_starred;

  if (!isBoolean(isStarred)) {
    return res.status(400).json({
      message: "The isStarred flag must be set to either true or false.",
    });
  }

  try {
    const foundConversation = await Conversation.findById(conversationId);
    if (!foundConversation) {
      // if no conversation found
      return res.status(404).json({ message: "No conversation found." });
    }

    if (req.user.organization_id != foundConversation.organization_id) {
      // If a view request is made for different organization's conversation
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }

    if (foundConversation.is_starred === isStarred) {
      // if the Starred status is already updated.
      return res.status(400).json({
        message: `Already marked as ${isStarred ? "starred" : "unstarred"}.`,
      });
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      is_starred: isStarred,
      updated_at: moment().tz("Etc/UTC"),
    });

    return res.status(200).json({
      message: `Successfully marked as ${isStarred ? "starred" : "unstarred"}.`,
    });
  } catch (err) {
    console.log("Error from individuallyMarkAsStarredUnstarred: ", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Delete Individual Conversation
const deleteIndividualConversation = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  try {
    const foundConversation = await Conversation.findById(conversationId);
    if (!foundConversation) {
      // if no conversation found
      return res.status(404).json({ message: "No conversation found." });
    }

    if (req.user.organization_id != foundConversation.organization_id) {
      // If a view request is made for different organization's conversation
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }

    if (foundConversation.is_deleted) {
      // if the conversation is already Deleted.
      return res
        .status(400)
        .json({ message: "The conversation has already been eliminated." });
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      is_deleted: true,
      updated_at: moment().tz("Etc/UTC"),
    });

    return res
      .status(200)
      .json({ message: "The conversation has been successfully eliminated." });
  } catch (err) {
    console.log("Error from markIndividualConversationAsUnstarred: ", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Delete multiple conversations by their IDs
const deleteBulkConversations = asyncHandler(async (req, res) => {
  const requestedConversationIds = req.body?.conversation_ids;
  if (
    requestedConversationIds === undefined ||
    requestedConversationIds === null ||
    requestedConversationIds.length === 0
  ) {
    return res.status(400).json({ message: "No conversation to delete." });
  }

  // Check if all conversationIds have the same organization_id
  const sameOrganizationConversations = await Conversation.find({
    $and: [
      {
        _id: { $in: requestedConversationIds },
        organization_id: { $all: [req.user.organization_id] },
      },
    ],
  }).select({ _id: 1 });

  // in future this constant can be saved in activity log
  // as a reason of failure.
  if (sameOrganizationConversations.length === 0) {
    // Few requested conversations belongs to a different organization
    return res.status(403).json({
      message: "Insufficient rights to access this resource.",
    });
  }
  // mapping the ObjectIds into Strings
  const safeConversations = sameOrganizationConversations.map((c) =>
    c._id.toString()
  );

  // if any requested conversation belongs to a different Organization
  // listed as unsafeConversations
  let unsafeConversations = [];
  if (requestedConversationIds.length !== safeConversations.length) {
    unsafeConversations = requestedConversationIds.filter(
      (reqCnvId) => !safeConversations.includes(reqCnvId)
    );
  }

  try {
    // the updateMany method to update multiple conversations by their IDs
    const result = await Conversation.updateMany(
      {
        _id: { $in: safeConversations }, // Match conversations by their IDs
      },
      {
        $set: { is_deleted: true, updated_at: moment().tz("Etc/UTC") }, // Update the isDeleted field to true
      }
    );

    res.status(200).json({
      message: `${result.modifiedCount} conversation${result.modifiedCount > 1 ? "(s) are" : " is"
        } deleted out of ${requestedConversationIds.length}`,
      failed_to_upload_conversations: unsafeConversations,
    });
  } catch (err) {
    console.log("Error: From delete bulk conversations", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Mark as read multiple conversations by their IDs
const markAsReadUnreadBulkConversations = asyncHandler(async (req, res) => {
  const requestedConversationIds = req.body?.conversation_ids;
  const isRead = req.body?.is_read;
  if (
    requestedConversationIds === undefined ||
    requestedConversationIds === null ||
    requestedConversationIds.length === 0
  ) {
    return res.status(400).json({ message: "No conversation found." });
  }

  if (!isBoolean(isRead)) {
    return res.status(400).json({
      message: "The isRead flag must be set to either true or false.",
    });
  }

  // Check if all conversationIds have the same organization_id
  const sameOrganizationConversations = await Conversation.find({
    $and: [
      {
        _id: { $in: requestedConversationIds },
        organization_id: { $all: [req.user.organization_id] },
      },
    ],
  }).select({ _id: 1 });

  // in future this constant can be saved in activity log
  // as a reason of failure.
  if (sameOrganizationConversations.length === 0) {
    // Few requested conversations belongs to a different organization
    return res.status(403).json({
      message: "Insufficient rights to access this resource.",
    });
  }
  // mapping the ObjectIds into Strings
  const safeConversations = sameOrganizationConversations.map((c) =>
    c._id.toString()
  );

  // if any requested conversation belongs to a different Organization
  // listed as unsafeConversations
  let unsafeConversations = [];
  if (requestedConversationIds.length !== safeConversations.length) {
    unsafeConversations = requestedConversationIds.filter(
      (reqCnvId) => !safeConversations.includes(reqCnvId)
    );
  }

  try {
    // the updateMany method to update multiple conversations by their IDs
    const result = await Conversation.updateMany(
      {
        _id: { $in: safeConversations }, // Match conversations by their IDs
      },
      {
        $set: { is_read: isRead, updated_at: moment().tz("Etc/UTC") }, // Update the isRead field
      }
    );

    res.status(200).json({
      message: `${result.modifiedCount} conversation${result.modifiedCount > 1 ? "(s) are" : " is"
        } marked as ${isRead ? "read" : "unread"} out of ${requestedConversationIds.length
        }`,
      failed_to_upload_conversations: unsafeConversations,
    });
  } catch (err) {
    console.log("Error: From markAsReadUnreadBulkConversations: ", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Mark as starred multiple conversations by their IDs
const markAsStarredUnstarredBulkConversations = asyncHandler(
  async (req, res) => {
    const requestedConversationIds = req.body?.conversation_ids;
    const isStarred = req.body?.is_starred;
    if (
      requestedConversationIds === undefined ||
      requestedConversationIds === null ||
      requestedConversationIds.length === 0
    ) {
      return res.status(400).json({ message: "No conversation to delete." });
    }

    if (!isBoolean(isStarred)) {
      return res.status(400).json({
        message: "The isStarred flag must be set to either true or false.",
      });
    }

    // Check if all conversationIds have the same organization_id
    const sameOrganizationConversations = await Conversation.find({
      $and: [
        {
          _id: { $in: requestedConversationIds },
          organization_id: { $all: [req.user.organization_id] },
        },
      ],
    }).select({ _id: 1 });

    // in future this constant can be saved in activity log
    // as a reason of failure.
    if (sameOrganizationConversations.length === 0) {
      // Few requested conversations belongs to a different organization
      return res.status(403).json({
        message: "Insufficient rights to access this resource.",
      });
    }

    // mapping the ObjectIds into Strings
    const safeConversations = sameOrganizationConversations.map((c) =>
      c._id.toString()
    );

    // if any requested conversation belongs to a different Organization
    // listed as unsafeConversations
    let unsafeConversations = [];
    if (requestedConversationIds.length !== safeConversations.length) {
      unsafeConversations = requestedConversationIds.filter(
        (reqCnvId) => !safeConversations.includes(reqCnvId)
      );
    }

    try {
      // the updateMany method to update multiple conversations by their IDs
      const result = await Conversation.updateMany(
        {
          _id: { $in: safeConversations }, // Match conversations by their IDs
        },
        {
          $set: { is_starred: isStarred, updated_at: moment().tz("Etc/UTC") }, // Update the isStarred field
        }
      );

      res.status(200).json({
        message: `${result.modifiedCount} conversation${result.modifiedCount > 1 ? "(s) are" : " is"
          } marked as ${isStarred ? "starred" : "unstarred"} out of ${requestedConversationIds.length
          }`,
        failed_to_upload_conversations: unsafeConversations,
      });
    } catch (err) {
      console.log("Error: From markAsStarredUnstarredBulkConversations: ", err);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// View conversation
const viewConversation = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  try {
    const requestedConversation = await Conversation.findById(conversationId);

    if (!requestedConversation || requestedConversation.is_deleted) {
      return res.status(404).send({ message: "No conversation found." });
    }

    if (requestedConversation.organization_id != req.user.organization_id) {
      // requested conversation belongs to a different organization
      return res.status(403).json({
        message: "Insufficient rights to access this resource.",
      });
    }

    return res.status(200).json({
      message: "Conversation details",
      data: requestedConversation,
    });
  } catch (err) {
    console.log("Error from viewConversation: ", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// list of conversations
const getConversationList = asyncHandler(async (req, res) => {
  const page = convertToNumberOrDefault(req?.query?.page, 1); // Page number (starting from 1)
  const limit = convertToNumberOrDefault(req?.query?.limit, 10); // Number of documents per page
  const sortBy = req?.query?.sort_by ? req.query.sort_by : "-last_message_date"; // by default Created At descending order.
  const search = req?.query?.search ? req.query.search : "";
  const assignedTo = req?.query?.assigned_to;
  const filters = {};

  if (req.query.is_read) {
    filters.is_read = req.query.is_read;
  }

  if (req.query.is_starred) {
    filters.is_starred = req.query.is_starred;
  }

  filters.is_deleted = false;
  filters.organization_id = req.user.organization_id;

  // Create a regular expression for wildcard search
  const regex = new RegExp(`.*${search}.*`, "i"); // "i" for case-insensitive search

  // Calculate the skip value based on the page size and number
  const skip = (page - 1) * limit;
  try {
    const query = Conversation.find({
      $and: [
        {
          $or: [
            { contact_email: { $regex: regex } },
            { contact_phone_number: { $regex: regex } },
            { last_message: { $regex: regex } },
          ],
        },
        filters,
      ],
    })
      .select({
        _id: 1,
        organization_id: 1,
        contact_id: 1,
        contact_email: 1,
        last_message: 1,
        last_message_date: 1,
        is_read: 1,
        is_starred: 1,
        is_deleted: 1,
        created_at: 1,
        updated_at: 1,
      })
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    // execute conversation Query
    let conversations = await query.populate("conversationContact").exec();

    if (assignedTo && assignedTo == "unassigned") {
      // if there is an unassigned conversation list request
      conversations = conversations.filter((conv) => {
        return !conv.conversationContact[0]?.assigned_to;
      });
    }

    if (assignedTo && assignedTo != "unassigned") {
      // if there is an assigned conversation list request
      // could be MyChat or someone else's from the same organization
      conversations = conversations.filter((conv) => {
        return conv.conversationContact[0]?.assigned_to == assignedTo;
      });
    }

    conversations = conversations.map((conv) => {
      const convObj = conv.toObject();
      convObj.contact_first_name = conv.conversationContact[0]?.first_name;
      convObj.contact_last_name = conv.conversationContact[0]?.last_name;

      return convObj;
    });

    // Getting the Total Document Count
    const totalCount = await Conversation.countDocuments(query.getFilter());

    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };
    res.status(200).json({
      message: "Conversation list",
      data: conversations,
      paginationData,
    });
  } catch (err) {
    console.log("Error from getConversationList: ", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export {
  deleteBulkConversations,
  deleteIndividualConversation,
  getConversationList,
  individuallyMarkAsReadUnread,
  individuallyMarkAsStarredUnstarred,
  markAsReadUnreadBulkConversations,
  markAsStarredUnstarredBulkConversations,
  viewConversation,
};
