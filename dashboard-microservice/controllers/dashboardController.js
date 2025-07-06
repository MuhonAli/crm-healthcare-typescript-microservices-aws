import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import Opportunity from "../models/opportunityModel.js";
import Pipeline from "../models/pipelineModel.js"; // Don't remove this import, it is required to resolved this error => ( MissingSchemaError: Schema hasn't been registered for model "contacts". )

const getDashboardInsight = asyncHandler(async (req, res) => {
  try {
    const pipelineId = req.query.pipeline_id;
    // filter query
    const matches = {
      organization_id: req.user.organization_id,
      is_deleted: false,
    };

    if (pipelineId) {
      matches.pipeline_id = new mongoose.Types.ObjectId(pipelineId);
    }

    const pipeline = [
      {
        $match: matches,
      },
      {
        $lookup: {
          from: "pipelines",
          localField: "pipeline_id",
          foreignField: "_id",
          as: "pipelineDetails",
        },
      },
      {
        $unwind: "$pipelineDetails",
      },
      {
        $group: {
          _id: {
            pipeline_id: "$pipelineDetails._id",
            pipeline_name: "$pipelineDetails.title",
            stage_name: "$pipeline_stage.stage_name",
          },
          opportunity_count: { $sum: 1 },
          total_opportunity_value: { $sum: "$opportunity_value" },
        },
      },
      {
        $project: {
          _id: 0,
          pipeline_id: "$_id.pipeline_id",
          pipeline_name: "$_id.pipeline_name",
          stage_name: "$_id.stage_name",
          opportunity_count: 1,
          total_opportunity_value: 1,
        },
      },
    ];

    // get all opportunities grouped by pipeline stage
    const result = await Opportunity.aggregate(pipeline);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set the time to midnight UTC

    matches.created_at = { $gte: today }; // get all opportunity created at "today"

    const pipelineForToday = [
      {
        $match: matches,
      },
      {
        $group: {
          _id: null,
          total_opportunity_value: { $sum: "$opportunity_value" },
        },
      },
      {
        $project: {
          _id: 0,
          total_opportunity_value: 1,
        },
      },
    ];

    const opportunityToday = await Opportunity.aggregate(pipelineForToday);

    return res.status(200).json({
      message: "Dashboard insight",
      data: {
        together: result,
        today: opportunityToday,
      },
    });
  } catch (err) {
    console.log("Error from getDashboardInsight: " + err);

    return res.status(500).json({ message: "Internal server error." });
  }
});

// group opportunities by current
const getOpportunitiesCountGroupByStatus = asyncHandler(async (req, res) => {
  try {
    const startDate = req.query.start_date
      ? new Date(req.query.start_date)
      : null;
    const endDate = req.query.end_date
      ? new Date(new Date(req.query.end_date).setUTCHours(23, 59, 59, 999))
      : new Date(new Date().setUTCHours(23, 59, 59, 999));
    // filter query
    const matches = {
      organization_id: req.user.organization_id,
      is_deleted: false,
    };

    if (startDate && endDate) {
      matches.created_at = { $gte: startDate, $lt: endDate }; // filter by created_at
    }

    const pipeline = [
      {
        $match: matches,
      },
      {
        $group: {
          _id: {
            current_status: "$current_status",
          },
          opportunity_count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          current_status: "$_id.current_status",
          opportunity_count: 1,
        },
      },
    ];

    // get all opportunities grouped by pipeline stage
    const result = await Opportunity.aggregate(pipeline);

    return res.status(200).json({
      message: "Opportinities count group by current status.",
      data: result,
    });
  } catch (err) {
    console.log("Error from getOpportunitiesCountGroupByStatus: ", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// group opportunities by current
const getOpportunitiesValueGroupByStatus = asyncHandler(async (req, res) => {
  try {
    const startDate = req.query.start_date
      ? new Date(req.query.start_date)
      : null;
    const endDate = req.query.end_date
      ? new Date(new Date(req.query.end_date).setUTCHours(23, 59, 59, 999))
      : new Date(new Date().setUTCHours(23, 59, 59, 999));
    // filter query
    const matches = {
      organization_id: req.user.organization_id,
      is_deleted: false,
    };

    if (startDate && endDate) {
      matches.created_at = { $gte: startDate, $lt: endDate }; // filter by created_at
    }

    const pipeline = [
      {
        $match: matches,
      },
      {
        $group: {
          _id: {
            current_status: "$current_status",
          },
          total_opportunity_value: { $sum: "$opportunity_value" },
        },
      },
      {
        $project: {
          _id: 0,
          current_status: "$_id.current_status",
          total_opportunity_value: 1,
        },
      },
    ];

    // get all opportunities grouped by pipeline stage
    const result = await Opportunity.aggregate(pipeline);

    return res.status(200).json({
      message: "Opportinities value group by current status.",
      data: result,
    });
  } catch (err) {
    console.log("Error from getOpportunitiesValueGroupByStatus: ", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Get Lead Source Report
const getSourceWiseOpportunityReport = asyncHandler(async (req, res) => {
  try {
    const startDate = req.query.start_date
      ? new Date(req.query.start_date)
      : null;
    const endDate = req.query.end_date
      ? new Date(new Date(req.query.end_date).setUTCHours(23, 59, 59, 999))
      : new Date(new Date().setUTCHours(23, 59, 59, 999));
    // filter query
    const matches = {
      organization_id: req.user.organization_id,
      is_deleted: false,
    };

    if (startDate && endDate) {
      matches.created_at = { $gte: startDate, $lt: endDate }; // filter by created_at
    }

    const pipeline = [
      {
        $match: matches,
      },
      {
        $group: {
          _id: {
            source: "$source",
            current_status: "$current_status",
          },
          total_opportunity_value: { $sum: "$opportunity_value" },
          opportunity_count: { $sum: 1 },
          won_wount: {
            $sum: {
              $cond: {
                if: { $eq: ["$current_status", "won"] },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.source",
          total_opportunity_value: { $sum: "$total_opportunity_value" },
          opportunity_count: { $sum: "$opportunity_count" },
          won_wount: { $sum: "$won_wount" },
          current_status_counts: {
            $push: {
              current_status: "$_id.current_status",
              count: "$opportunity_count",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          total_opportunity_value: 1,
          opportunity_count: 1,
          win_rate: {
            $multiply: [
              { $divide: ["$won_wount", "$opportunity_count"] },
              100, // Multiply by 100 to get the percentage
            ],
          },
          current_status_counts: 1,
        },
      },
    ];

    // get all opportunities grouped by pipeline stage
    const result = await Opportunity.aggregate(pipeline);

    return res.status(200).json({
      message: "Lead Source Report.",
      data: result,
    });
  } catch (err) {
    console.log("Error from getSourceWiseOpportunityReport: ", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

export {
  getDashboardInsight,
  getOpportunitiesCountGroupByStatus,
  getOpportunitiesValueGroupByStatus,
  getSourceWiseOpportunityReport,
};
