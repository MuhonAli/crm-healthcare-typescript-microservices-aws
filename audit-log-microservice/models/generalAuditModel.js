import mongoose from "mongoose";

const generalAuditSchema = new mongoose.Schema(
    {
    organization_id: {
      type: String,
      required: true,
    },
    table_name: {
      type: String,
      required: true,
    },
    module_name: {
      type: String,
      required: true,
    },
    user_name: {
      type: String,
      required: true,
    },
    action_taken: {
      type: String,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
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

generalAuditSchema.methods.toJSON = function () {
  const generalAuditObject = this.toObject();
  delete generalAuditObject.is_deleted;
  return generalAuditObject;
};

const GeneralAudit = mongoose.model("generalAudit", generalAuditSchema);

export default GeneralAudit;