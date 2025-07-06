import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    username: { type: String, required: true },
    reset_password_token: { type: String },
    created_at: {
      type: Date,
      default: Date.now,
      expires: 60 * 15, // The document will be automatically deleted after 15 minutes of its creation time
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

const PasswordReset = mongoose.model("password_resets", passwordResetSchema);

export default PasswordReset;
