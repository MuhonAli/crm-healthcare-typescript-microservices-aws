import mongoose from "mongoose";

const emailHistorySchema = new mongoose.Schema(
  {
    organization_id: {
      type: String,
      required: true,
    },
    inbound: {
      type: Boolean,
      required: true,
    },
    recipient: {
      recipient_id: { type: String },
      first_name: { type: String },
      is_active: { type: Boolean },
      profile_pic_url: { type: String },
    },
    sender: {
      sender_id: { type: String },
      first_name: { type: String },
      is_active: { type: Boolean },
      profile_pic_url: { type: String },
    },
    to: {
      email: {
        type: String,
        required: true,
      },
      name: {
        type: String,
      },
      _id: false,
    },
    from: {
      email: {
        type: String,
        required: true,
      },
      name: {
        type: String,
      },
      _id: false,
    },
    subject: {
      type: String,
      required: true,
    },
    content: [
      {
        type: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
        _id: false,
      },
    ],
    send_at: {
      type: Date,
    },
    received_at: {
      type: Date,
    },
    current_status: {
      type: String,
      default: "processing",
    },
    batch_id: {
      type: String,
    },
    sg_message_id: {
      type: String,
    },
    attachments: [
      {
        content: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        disposition: {
          type: String,
          default: "attachment",
        },
      },
    ],
    statistics: {
      processed: {
        type: Boolean,
        default: true,
      },
      delivered: {
        type: Boolean,
        default: false,
      },
      opened: {
        type: Boolean,
        default: false,
      },
      clicked: {
        type: Boolean,
        default: false,
      },
      soft_bounced: {
        type: Boolean,
        default: false,
      },
      hard_bounced: {
        type: Boolean,
        default: false,
      },
      unsubscribed: {
        type: Boolean,
        default: false,
      },
      failed: {
        type: Boolean,
        default: false,
      },
      spamed: {
        type: Boolean,
        default: false,
      },
      replied: {
        type: Boolean,
        default: false,
      },
      is_scheduled: { type: Boolean, default: false },
      canceled_schedule: {
        type: Boolean,
        default: false,
      },
      canceled_schedule_by: {
        type: String, // will be Schema.types.ObjectId ( user id )
      },
    },
    is_tried: {
      type: Boolean,
      default: false,
    },
    is_sent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

const EmailHistory = mongoose.model("email_histories", emailHistorySchema);

export default EmailHistory;
