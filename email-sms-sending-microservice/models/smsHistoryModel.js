import mongoose from "mongoose";

const smsHistorySchema = new mongoose.Schema(
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
    dst: {
      type: String,
      required: true,
    },
    src: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "sms",
    },
    send_at: {
      type: Date,
    },
    received_at: {
      type: Date,
    },
    current_status: {
      type: String,
      default: "queued",
    },
    pli_message_uuid: {
      type: String,
    },
    is_scheduled: { type: Boolean, default: false },
    canceled_schedule: {
      type: Boolean,
      default: false,
    },
    canceled_schedule_by: {
      type: String,
    },
    is_tried: {
      type: Boolean,
      default: false,
    },
    is_sent: {
      type: Boolean,
      default: false,
    },
    batch_id: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

const SMSHistory = mongoose.model("sms_histories", smsHistorySchema);

export default SMSHistory;
