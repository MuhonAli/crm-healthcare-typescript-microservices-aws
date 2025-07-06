import mongoose, { Schema } from "mongoose";
import Contact from "./contactModel.js"; // Don't remove this import, it is required to resolved this error => ( MissingSchemaError: Schema hasn't been registered for model "contacts". )
export const validConversatioChannels = ["email", "sms"];

const conversationSchema = new mongoose.Schema(
  {
    organization_id: {
      type: String,
      required: true,
    },
    contact_id: {
      type: Schema.Types.ObjectId,
      ref: "contacts",
      required: true,
    },
    contact_email: {
      type: String,
    },
    contact_phone_number: {
      type: String,
    },
    last_message: {
      type: String,
    },
    last_message_date: {
      type: Date,
    },
    conversations: {
      type: [
        {
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
          channel: {
            type: String,
            enum: validConversatioChannels,
          },
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
          to: {
            email: {
              type: String,
            },
            name: {
              type: String,
            },
            _id: false,
          },
          from: {
            email: {
              type: String,
            },
            name: {
              type: String,
            },
            _id: false,
          },
          subject: {
            type: String,
          },
          content: [
            {
              type: {
                type: String,
              },
              value: {
                type: String,
              },
              _id: false,
            },
          ],
          attachments: [
            {
              content: {
                type: String,
              },
              filename: {
                type: String,
              },
              type: {
                type: String,
              },
              disposition: {
                type: String,
              },
            },
          ],
          dst: {
            type: String,
          },
          src: {
            type: String,
          },
          text: {
            type: String,
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
            type: String, // will be Schema.types.ObjectId ( user id )
          },
        },
      ],
      default: [],
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    is_starred: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Define a compound unique index for organization_id, and contact_id
conversationSchema.index(
  { organization_id: 1, contact_id: 1 },
  { unique: true }
);

// Virtual representation for Conversation-Contact
conversationSchema.virtual("conversationContact", {
  ref: "contacts",
  localField: "contact_id",
  foreignField: "_id",
});

conversationSchema.methods.toJson = function () {
  const conversationObject = this.toObject();
  delete conversationObject.is_deleted;
  return conversationObject;
};

const Conversation = mongoose.model("conversations", conversationSchema);

export default Conversation;

