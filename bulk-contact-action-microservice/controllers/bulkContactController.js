import asyncHandler from "express-async-handler";
import moment from "moment-timezone";
import Contact from "../models/contactModel.js";
import { validateTags } from "../utils/formatContactObject.js";
import Conversation from "../models/conversationModel.js";
import Opportunity from "../models/opportunityModel.js";
import { pushDataToAwsSqs } from "../utils/pushDataToAwsSqs.js";

// Delete multiple contacts by their IDs
const deleteBulkContacts = asyncHandler(async (req, res) => {
  const requestedContactIds = req.body?.contact_ids;
  if (
    requestedContactIds === undefined ||
    requestedContactIds === null ||
    requestedContactIds.length === 0
  ) {
    return res.status(400).json({ message: "No contacts to delete." });
  }

  // Check if all contactIds have the same organization_id
  const sameOrganizationContacts = await Contact.find({
    $and: [
      {
        _id: { $in: requestedContactIds },
        organization_id: { $all: [req.user.organization_id] },
      },
    ],
  }).select({ _id: 1 });

  // in future this constant can be saved in activity log
  // as a reason of failure.
  if (sameOrganizationContacts.length === 0) {
    // Few requested contacts belongs to a different organization
    return res.status(403).json({
      message: "Insufficient rights to access this resource.",
    });
  }
  // mapping the ObjectIds into Strings
  const safeContacts = sameOrganizationContacts.map((c) => c._id.toString());

  // if any requested contact belongs to a different Organization
  // listed as unsafeContacts
  let unsafeContacts = [];
  if (requestedContactIds.length !== safeContacts.length) {
    unsafeContacts = requestedContactIds.filter(
      (reqCntId) => !safeContacts.includes(reqCntId)
    );
  }

  try {
    // the updateMany method to update multiple contacts by their IDs
    const result = await Contact.updateMany(
      {
        _id: { $in: safeContacts }, // Match contacts by their IDs
      },
      {
        $set: { is_deleted: true, updated_at: moment().tz("Etc/UTC") }, // Update the is_deleted field to true
      }
    );

    if (result.modifiedCount > 0) {
      // update associated conversations
      await Conversation.updateMany(
        {
          contact_id: { $in: safeContacts }, // Match contacts by their IDs
        },
        {
          $set: { is_deleted: true, updated_at: moment().tz("Etc/UTC") }, // Update the is_deleted field to true
        }
      );
      // update associated Opportunities
      await Opportunity.updateMany(
        {
          contact_id: { $in: safeContacts }, // Match contacts by their IDs
        },
        {
          $set: { is_deleted: true, updated_at: moment().tz("Etc/UTC") }, // Update the is_deleted field to true
        }
      );
    }

    // sqs Object
    const sqsMessageObject = {
      organization_id: req.user.organization_id,
      table_name: "Contact",
      module_name: "Contact",
      user_name: req?.user?.username,
      action_taken: "Deleted Bulk Contacts" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    res.status(200).json({
      message: `${result.modifiedCount} contact${result.modifiedCount > 1 ? "(s) are" : " is"
        } deleted out of ${requestedContactIds.length}`,
      failed_to_upload_contacts: unsafeContacts,
    });
  } catch (err) {
    console.log("Error: From delete bulk contacts", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Star multiple contacts by their IDs
const starBulkContacts = asyncHandler(async (req, res) => {
  const requestedContactIds = req.body?.contact_ids;
  if (
    requestedContactIds === undefined ||
    requestedContactIds === null ||
    requestedContactIds.length === 0
  ) {
    return res.status(400).json({ message: "No contacts to star." });
  }

  try {
    // Check if all contactIds have the same organization_id
    const sameOrganizationContacts = await Contact.find({
      $and: [
        {
          _id: { $in: requestedContactIds },
          organization_id: { $all: [req.user.organization_id] },
        },
      ],
    }).select({ _id: 1 });

    // in future this constant can be saved in activity log
    // as a reason of failure.
    if (sameOrganizationContacts.length === 0) {
      // Few requested contacts belongs to a different organization
      return res.status(403).json({
        message: "Insufficient rights to access this resource.",
      });
    }
    // mapping the ObjectIds into Strings
    const safeContacts = sameOrganizationContacts.map((c) => c._id.toString());

    // if any requested contact belongs to a different Organization
    // listed as unsafeContacts
    let unsafeContacts = [];
    if (requestedContactIds.length !== safeContacts.length) {
      unsafeContacts = requestedContactIds.filter(
        (reqCntId) => !safeContacts.includes(reqCntId)
      );
    }
    // the updateMany method to update multiple contacts by their IDs
    const result = await Contact.updateMany(
      {
        _id: { $in: safeContacts }, // Match contacts by their IDs
      },
      {
        $set: { is_starred: true, updated_at: moment().tz("Etc/UTC") }, // Update the is_starred field to true
      }
    );

    // sqs Object
    const sqsMessageObject = {
      organization_id: req.user.organization_id,
      table_name: "Contact",
      module_name: "Contact",
      user_name: req?.user?.username,
      action_taken: "Star Bulk Contacts" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    res.status(200).json({
      message: `${result.modifiedCount} contact${result.modifiedCount > 1 ? "(s) are" : " is"
        } starred out of ${requestedContactIds.length}`,
      failed_to_upload_contacts: unsafeContacts,
    });
  } catch (err) {
    console.log("Error: From star bulk contacts", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Unstar multiple contacts by their IDs
const unstarBulkContacts = asyncHandler(async (req, res) => {
  const requestedContactIds = req.body?.contact_ids;
  if (
    requestedContactIds === undefined ||
    requestedContactIds === null ||
    requestedContactIds.length === 0
  ) {
    return res.status(400).json({ message: "No contacts to remove star." });
  }

  try {
    // Check if all contactIds have the same organization_id
    const sameOrganizationContacts = await Contact.find({
      $and: [
        {
          _id: { $in: requestedContactIds },
          organization_id: { $all: [req.user.organization_id] },
        },
      ],
    }).select({ _id: 1 });

    // in future this constant can be saved in activity log
    // as a reason of failure.
    if (sameOrganizationContacts.length === 0) {
      // Few requested contacts belongs to a different organization
      return res.status(403).json({
        message: "Insufficient rights to access this resource.",
      });
    }
    // mapping the ObjectIds into Strings
    const safeContacts = sameOrganizationContacts.map((c) => c._id.toString());

    // if any requested contact belongs to a different Organization
    // listed as unsafeContacts
    let unsafeContacts = [];
    if (requestedContactIds.length !== safeContacts.length) {
      unsafeContacts = requestedContactIds.filter(
        (reqCntId) => !safeContacts.includes(reqCntId)
      );
    }
    // the updateMany method to update multiple contacts by their IDs
    const result = await Contact.updateMany(
      {
        _id: { $in: safeContacts }, // Match contacts by their IDs
      },
      {
        $set: { is_starred: false, updated_at: moment().tz("Etc/UTC") }, // Update the is_starred field to false
      }
    );

    // sqs Object
    const sqsMessageObject = {
      organization_id: req.user.organization_id,
      table_name: "Contact",
      module_name: "Contact",
      user_name: req?.user?.username,
      action_taken: "Unstar Bulk Contacts" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    res.status(200).json({
      message: `Remove star from ${result.modifiedCount} contact${result.modifiedCount > 1 ? "(s)" : ""
        } out of ${requestedContactIds.length}`,
      failed_to_upload_contacts: unsafeContacts,
    });
  } catch (err) {
    console.log("Error: From unstar bulk contacts", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Add tags to multiple contacts by their IDs
const addTagsToBulkContacts = asyncHandler(async (req, res) => {
  const { contact_ids, tags } = req.body;

  if (
    contact_ids === undefined ||
    contact_ids === null ||
    !Array.isArray(contact_ids)
  ) {
    // if contact_ids is undefined, null or is not an array, return an error
    return res.status(400).json({ message: "No contacts to add tags." });
  }

  if (tags === undefined || tags === null || !validateTags(tags)) {
    // if tags is not valid, return an error
    return res.status(400).json({ message: "Invalid tags." });
  }

  try {
    // Check if all contact_ids have the same organization_id
    const sameOrganizationContacts =
      contact_ids.length > 0
        ? await Contact.find({
          $and: [
            {
              _id: { $in: contact_ids },
              organization_id: { $all: [req.user.organization_id] },
            },
          ],
        }).select({ _id: 1 })
        : [];

    // in future this constant can be saved in activity log
    // as a reason of failure.
    if (contact_ids.length > 0 && sameOrganizationContacts.length === 0) {
      // Few requested contacts belongs to a different organization
      return res.status(403).json({
        message: "Insufficient rights to access this resource.",
      });
    }
    // mapping the ObjectIds into Strings
    const safeContacts = sameOrganizationContacts.map((c) => c._id.toString());

    // if any requested contact belongs to a different Organization
    // listed as unsafeContacts
    let unsafeContacts = [];
    if (contact_ids.length !== safeContacts.length) {
      unsafeContacts = contact_ids.filter(
        (reqCntId) => !safeContacts.includes(reqCntId)
      );
    }

    // check if there is request for all documents or selected documents
    const query =
      contact_ids.length === 0
        ? { is_deleted: false, organization_id: req.user.organization_id }
        : { _id: { $in: safeContacts }, is_deleted: false };
    // the updateMany method to update multiple contacts by the query
    const result = await Contact.updateMany(query, {
      $addToSet: { tags: { $each: tags } },
      updated_at: moment().tz("Etc/UTC"),
    });

    // sqs Object
    const sqsMessageObject = {
      organization_id: req.user.organization_id,
      table_name: "Contact",
      module_name: "Contact",
      user_name: req?.user?.username,
      action_taken: "Add tag to Bulk Contacts" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    // The $addToSet operator is used to add elements to the tags array without duplicates.
    // The $each modifier is used to specify an array of values to add.
    res.status(200).json({
      message: `${result.modifiedCount} contact${result.modifiedCount > 1 ? "(s) are" : " is"
        } updated`,
      failed_to_upload_contacts: unsafeContacts,
    });
  } catch (err) {
    console.log("Error: From Add Tags To Bulk Contacts", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Remove tags to multiple contacts by their IDs
const removeTagsToBulkContacts = asyncHandler(async (req, res) => {
  const { contact_ids, tags } = req.body;

  if (
    contact_ids === undefined ||
    contact_ids === null ||
    !Array.isArray(contact_ids)
  ) {
    // if contact_ids is undefined, null or is not an array, return an error
    return res.status(400).json({ message: "No contacts to remove tags." });
  }

  if (tags === undefined || tags === null || !validateTags(tags)) {
    // if tags is not valid, return an error
    return res.status(400).json({ message: "Invalid tags." });
  }

  try {
    // Check if all contact_ids have the same organization_id
    const sameOrganizationContacts =
      contact_ids.length > 0
        ? await Contact.find({
          $and: [
            {
              _id: { $in: contact_ids },
              organization_id: { $all: [req.user.organization_id] },
            },
          ],
        }).select({ _id: 1 })
        : [];

    // in future this constant can be saved in activity log
    // as a reason of failure.
    if (contact_ids.length > 0 && sameOrganizationContacts.length === 0) {
      // Few requested contacts belongs to a different organization
      return res.status(403).json({
        message: "Insufficient rights to access this resource.",
      });
    }
    // mapping the ObjectIds into Strings
    const safeContacts = sameOrganizationContacts.map((c) => c._id.toString());

    // if any requested contact belongs to a different Organization
    // listed as unsafeContacts
    let unsafeContacts = [];
    if (contact_ids.length !== safeContacts.length) {
      unsafeContacts = contact_ids.filter(
        (reqCntId) => !safeContacts.includes(reqCntId)
      );
    }

    // check if there is request for all documents or selected documents
    const query =
      contact_ids.length === 0
        ? { is_deleted: false, organization_id: req.user.organization_id }
        : { _id: { $in: safeContacts }, is_deleted: false };
    // the updateMany method to update multiple contacts by the query
    const result = await Contact.updateMany(query, {
      $pullAll: { tags: tags },
      updated_at: moment().tz("Etc/UTC"),
    });

    // sqs Object
    const sqsMessageObject = {
      organization_id: req.user.organization_id,
      table_name: "Contact",
      module_name: "Contact",
      user_name: req?.user?.username,
      action_taken: "Remove tag to Bulk Contacts" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    // The $pullAll operator is used to remove elements from the tags array
    // that match the values in the requested tags array.
    res.status(200).json({
      message: `${result.modifiedCount} contact${result.modifiedCount > 1 ? "(s) are" : " is"
        } updated`,
      failed_to_upload_contacts: unsafeContacts,
    });
  } catch (err) {
    console.log("Error: From Add Tags To Bulk Contacts", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Change Pipeline stage to multiple contacts by their IDs
const changePipelineStageToBulkContacts = asyncHandler(async (req, res) => {
  const { contact_ids, pipeline_stage } = req.body;
  if (
    contact_ids === undefined ||
    contact_ids === null ||
    !Array.isArray(contact_ids)
  ) {
    // if contact_ids is undefined, null or is not an array, return an error
    return res
      .status(400)
      .json({ message: "No contacts to update pipeline stage." });
  }

  const trimedPipelineStage = pipeline_stage ? pipeline_stage.trim() : null;

  if (
    pipeline_stage === undefined ||
    trimedPipelineStage === null ||
    trimedPipelineStage === ""
  ) {
    // if pipelineStage is not valid, return an error
    return res.status(400).json({ message: "Invalid pipeline stage." });
  }

  try {
    // Check if all contact_ids have the same organization_id
    const sameOrganizationContacts =
      contact_ids.length > 0
        ? await Contact.find({
          $and: [
            {
              _id: { $in: contact_ids },
              organization_id: { $all: [req.user.organization_id] },
            },
          ],
        }).select({ _id: 1 })
        : [];

    // in future this constant can be saved in activity log
    // as a reason of failure.
    if (contact_ids.length > 0 && sameOrganizationContacts.length === 0) {
      // Few requested contacts belongs to a different organization
      return res.status(403).json({
        message: "Insufficient rights to access this resource.",
      });
    }
    // mapping the ObjectIds into Strings
    const safeContacts = sameOrganizationContacts.map((c) => c._id.toString());

    // if any requested contact belongs to a different Organization
    // listed as unsafeContacts
    let unsafeContacts = [];
    if (contact_ids.length !== safeContacts.length) {
      unsafeContacts = contact_ids.filter(
        (reqCntId) => !safeContacts.includes(reqCntId)
      );
    }

    // check if there is request for all documents or selected documents
    const query =
      contact_ids.length === 0
        ? { is_deleted: false, organization_id: req.user.organization_id }
        : { _id: { $in: safeContacts }, is_deleted: false };
    // the updateMany method to update multiple contacts by the query
    const result = await Contact.updateMany(query, {
      $set: { pipeline_stage: trimedPipelineStage },
    });

    // sqs Object
    const sqsMessageObject = {
      organization_id: req.user.organization_id,
      table_name: "Contact",
      module_name: "Contact",
      user_name: req?.user?.username,
      action_taken: "Change pipeline stage to Bulk Contacts" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    // The $set operator is used to set the pipeline_stage field
    // to the new value specified in requested pipelineStage.

    res.status(200).json({
      message: `${result.modifiedCount} contact${result.modifiedCount > 1 ? "(s) are" : " is"
        } updated`,
      failed_to_upload_contacts: unsafeContacts,
    });
  } catch (err) {
    console.log("Error: From Add Tags To Bulk Contacts", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Restore multiple contacts by their IDs
const restoreBulkContacts = asyncHandler(async (req, res) => {
  const requestedContactIds = req.body?.contact_ids;
  if (
    requestedContactIds === undefined ||
    requestedContactIds === null ||
    requestedContactIds.length === 0
  ) {
    return res.status(400).json({ message: "No contacts to Restore." });
  }

  try {
    // Check if all contactIds have the same organization_id
    const sameOrganizationContacts = await Contact.find({
      $and: [
        {
          _id: { $in: requestedContactIds },
          organization_id: { $all: [req.user.organization_id] },
        },
      ],
    }).select({ _id: 1 });

    // in future this constant can be saved in activity log
    // as a reason of failure.
    if (sameOrganizationContacts.length === 0) {
      // Few requested contacts belongs to a different organization
      return res.status(403).json({
        message: "Insufficient rights to access this resource.",
      });
    }
    // mapping the ObjectIds into Strings
    const safeContacts = sameOrganizationContacts.map((c) => c._id.toString());

    // if any requested contact belongs to a different Organization
    // listed as unsafeContacts
    let unsafeContacts = [];
    if (requestedContactIds.length !== safeContacts.length) {
      unsafeContacts = requestedContactIds.filter(
        (reqCntId) => !safeContacts.includes(reqCntId)
      );
    }

    // the updateMany method to update multiple contacts by their IDs
    const result = await Contact.updateMany(
      {
        _id: { $in: safeContacts }, // Match contacts by their IDs
      },
      {
        $set: { is_deleted: false, updated_at: moment().tz("Etc/UTC") }, // Update the is_deleted field to false
      }
    );

    if (result.modifiedCount > 0) {
      // update associated conversations
      await Conversation.updateMany(
        {
          contact_id: { $in: safeContacts }, // Match contacts by their IDs
        },
        {
          $set: { is_deleted: false, updated_at: moment().tz("Etc/UTC") }, // Update the is_deleted field to false
        }
      );
      // update associated Opportunities
      await Opportunity.updateMany(
        {
          contact_id: { $in: safeContacts }, // Match contacts by their IDs
        },
        {
          $set: { is_deleted: false, updated_at: moment().tz("Etc/UTC") }, // Update the is_deleted field to false
        }
      );
    }

    // sqs Object
    const sqsMessageObject = {
      organization_id: req.user.organization_id,
      table_name: "Contact",
      module_name: "Contact",
      user_name: req?.user?.username,
      action_taken: "Restore Bulk Contacts" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);


    res.status(200).json({
      message: `${result.modifiedCount} contact${result.modifiedCount > 1 ? "(s) are" : " is"
        } restored out of ${requestedContactIds.length}`,
      failed_to_upload_contacts: unsafeContacts,
    });
  } catch (err) {
    console.log("Error: From restore bulk contacts", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

export {
  addTagsToBulkContacts,
  changePipelineStageToBulkContacts,
  deleteBulkContacts,
  removeTagsToBulkContacts,
  restoreBulkContacts,
  starBulkContacts,
  unstarBulkContacts,
};
