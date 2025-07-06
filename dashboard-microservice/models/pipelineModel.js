import mongoose from "mongoose";

const pipelineSchema = new mongoose.Schema(
  {
    organization_id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    stages: [
      {
        order: {
          type: Number,
          required: true,
        },
        stage_name: {
          type: String,
          required: true,
        },
        is_default: {
          type: Boolean,
          default: false,
        },
        _id: false,
      },
    ],
    is_default: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: String, // will be Schema.types.ObjectId ( user id )
      required: true,
    },
    updated_by: {
      type: String, // will be Schema.types.ObjectId ( user id )
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

// Define a compound unique index for organization_id and title
pipelineSchema.index({ organization_id: 1, title: 1 }, { unique: true });

pipelineSchema.methods.toJSON = function () {
  const pipelineObject = this.toObject();
  delete pipelineObject.is_deleted;
  return pipelineObject;
};

const Pipeline = mongoose.model("pipelines", pipelineSchema);
export default Pipeline;
