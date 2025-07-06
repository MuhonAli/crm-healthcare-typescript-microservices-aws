import asyncHandler from "express-async-handler";
import GeneralAudit from "../models/generalAuditModel.js";
import { generateAuditLogFilters } from "../utils/generateFilters.js";

// List of GeneralAuditLogs
const getGeneralAuditLogs = asyncHandler(async (req, res) => {
  const page = req?.query?.page ? Number(req.query.page) : 1; // Page number (starting from 1)
  const limit = req?.query?.limit ? Number(req.query.limit) : 10; // Number of documents per page
  const sortBy = req?.query?.sortBy ? req.query.sortBy : "-createdAt"; // by default Created At descending order.
  const search = req?.query?.search ? req.query.search : "";
  const organizationId = req?.query?.organizationId ? req.query.organizationId : "";
  const filters = generateAuditLogFilters(req);
  // Create a regular expression for wildcard search
  const regex = new RegExp(`.*${search}.*`, "i"); // "i" for case-insensitive search

  // Date range query for created_at field (if any)
  const created_at =
    req.query.start_date && req.query.end_date
      ? {
        $gte: new Date(req.query.start_date),
        $lte: new Date(req.query.end_date),
      }
      : undefined;

  // Calculate the skip value based on the page size and number
  const skip = (page - 1) * limit;

  if (
    req.user.organization_id !== organizationId
  ) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  
  try {

    // get the actual query based on the query params
    const actualQuery = created_at
      ? {
        $and: [
          {
            $or: [
              { module_name: { $regex: regex } },
              { table_name: { $regex: regex } },
              { user_name: { $regex: regex } },
              { action_taken: { $regex: regex } },
            ],
          },
          filters, // This should already include conditions like is_deleted and is_active
          { organization_id: organizationId, 
            created_at: created_at },
        ],
      }
      : {
        $and: [
          {
            $or: [
              { module_name: { $regex: regex } },
              { table_name: { $regex: regex } },
              { user_name: { $regex: regex } },
              { action_taken: { $regex: regex } },
            ],
          },
          filters, // This should already include conditions like is_deleted and is_active
          { organization_id: organizationId },
        ],
      };

    const query = GeneralAudit.find(actualQuery)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    // execute tag Query
    const generalAudits = await query.exec();

    // Getting the Total Document Count
    const totalCount = await GeneralAudit.countDocuments(query.getFilter());

    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };
    res.status(200).json({
      message: "General Audit list",
      data: generalAudits,
      paginationData,
    });
  } catch (err) {
    console.log("Error from General Audit list: ", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export {
  getGeneralAuditLogs,
};
