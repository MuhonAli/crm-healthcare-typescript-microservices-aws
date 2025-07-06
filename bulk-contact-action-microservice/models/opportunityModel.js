import mongoose, { Schema } from "mongoose";

// Allowed status
export const allowedCurrentStatus = ["opened", "won", "lost"];

const opportunitySchema = new mongoose.Schema(
  {
    organization_id: {
      type: String,
      required: true,
    },
    opportunity_name: {
      type: String,
      required: true,
    },
    contact_id: {
      type: Schema.Types.ObjectId,
      ref: "contacts",
      required: true,
    },
    contact_name: {
      type: String,
      required: true,
    },
    contact_email: {
      type: String,
    },
    contact_phone: {
      type: String,
    },
    pipeline_id: {
      type: Schema.Types.ObjectId,
      ref: "pipelines",
      required: true,
    },
    pipeline_stage: {
      stage_name: {
        type: String,
        required: true,
      },
      order: {
        type: Number,
        required: true,
      },
      is_default: {
        type: Boolean,
      },
    },
    assigned_to: {
      type: String,
    },
    current_status: {
      type: String,
      default: "opened",
      enum: allowedCurrentStatus,
    },
    opportunity_value: {
      type: Number,
      default: 0.0,
    },
    source: {
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

// removing isDeleted field from response
opportunitySchema.methods.toJSON = function () {
  const opportunityObject = this.toObject();
  delete opportunityObject.is_deleted;
  return opportunityObject;
};

// Virtual representation for pipeline
opportunitySchema.virtual("pipelineDetails", {
  ref: "pipelines",
  localField: "pipeline_id",
  foreignField: "_id",
});
// Virtual representation for contact
opportunitySchema.virtual("contactDetails", {
  ref: "contacts",
  localField: "contact_id",
  foreignField: "_id",
});

const Opportunity = mongoose.model("opportunities", opportunitySchema);
export default Opportunity;
