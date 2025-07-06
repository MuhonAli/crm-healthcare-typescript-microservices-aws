import mongoose from "mongoose";

const emailCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  scheduling_date: {
    type: Date,
    required: true,
  },
  execution_date: {
    type: Date,
    required: true,
  },
  execution_type: {
    type: String,
    required: true,
  },
  batch_amount: {
    type: Number,
  },
  repeat_after: {
    type: Number,
  },
  campaign_status: {
    type: String,
    required: true,
  },
  contact_list: {
    type: [String],
    required: true,
  },
  content_details: {
    subject: {
      type: String,
      required: true,
    },
    from_email: {
      type: String,
      required: true,
    },
    email_body: {
      type: String,
      required: true,
    },
    email_template_id: {
      type: String, // will be Schema.Types.ObjectId once the email template is ready.
    },
  },
  summary_stats: {
    delivered: {
      type: Number,
      default: 0,
    },
    opened: {
      type: Number,
      default: 0,
    },
    clicked: {
      type: Number,
      default: 0,
    },
    replied: {
      type: Number,
      default: 0,
    },
    hard_bounced: {
      type: Number,
      default: 0,
    },
    soft_bounced: {
      type: Number,
      default: 0,
    },
    complained: {
      type: Number,
      default: 0,
    },
    unsubscribed: {
      type: Number,
      default: 0,
    },
  },
  created_by: {
    type: String, // will be Schema.Types.ObjectId once the User is ready.
    required: true,
  },
  updated_by: {
    type: String, // will be Schema.Types.ObjectId once the User is ready.
    required: true,
  },
});
