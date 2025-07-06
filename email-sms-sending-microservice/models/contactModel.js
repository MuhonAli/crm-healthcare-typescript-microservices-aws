import mongoose, { Schema } from "mongoose";
const contactSchema = new mongoose.Schema(
  {
    organization_id: {
      type: String,
      required: true,
    },
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    date_of_birth: {
      type: Date,
    },
    gender: {
      type: String,
    },
    age: {
      type: Number,
    },
    is_starred: {
      type: Boolean,
      default: false,
    },
    active_campaign: {
      type: [
        {
          campaign_id: {
            type: String,
            required: true,
          },
          campaign_type: {
            type: String,
            required: true,
          },
          _id: false,
        },
      ],
    },
    pipeline_stage: {
      type: String,
    },
    business_name: {
      type: String,
    },
    phone: {
      type: String,
    },
    is_valid_phone_number: {
      type: Boolean,
    },
    email: {
      type: String,
    },
    height: {
      type: String,
    },
    weight: {
      type: String,
    },
    current_weight: {
      type: String,
    },
    nationality: {
      type: String,
    },
    source: {
      type: String,
    },
    last_activity: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    last_appointment: {
      type: Schema.Types.ObjectId,
      ref: "appointments",
    },
    notes: {
      type: [
        {
          note: { type: String },
          note_by: { type: String }, // will be Schema.types.ObjectId ( user id )
          note_date: { type: Date },
          _id: false,
        },
      ],
    },
    assigned_to: {
      type: String,
    },
    street_address: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    postal_code: {
      type: String,
    },
    dnd: {
      type: Boolean,
      default: false,
    },
    dnd_email: {
      type: Boolean,
      default: false,
    },
    dnd_sms: {
      type: Boolean,
      default: false,
    },
    time_zone: {
      type: String,
    },
    last_payment_amount: {
      type: String,
    },
    milestones: {
      type: [String],
    },
    additional_info: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "conversations",
      default: null,
    },
    contact_type: {
      type: String,
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

// Define a compound unique index for organization_id and email
contactSchema.index({ organization_id: 1, email: -1 }, { unique: true });

// Define a compound unique index for organization_id and phone
contactSchema.index({ organization_id: 1, phone: -1 }, { unique: true });

contactSchema.methods.toJSON = function () {
  const contactObject = this.toObject();
  delete contactObject.is_deleted;
  return contactObject;
};

const Contact = mongoose.model("contacts", contactSchema);

export default Contact;
