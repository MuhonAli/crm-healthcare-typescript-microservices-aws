import mongoose, { Schema } from "mongoose";

const userPermissionSchema = new mongoose.Schema(
  {
    organization_id: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    username: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    permissions: { type: [String], required: true },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

userPermissionSchema.methods.toJSON = function () {
  const userPermissionObject = this.toObject();
  delete userPermissionObject.is_deleted;

  return userPermissionObject;
};

const UserPermission = mongoose.model("user_permissions", userPermissionSchema);

export default UserPermission;
