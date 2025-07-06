import User from "../models/userModel.js";
import { userRoles, userPermissions } from "../config/userPermissions.js";
import { validateUserName } from "./validateRegPayload.js";

// validate userPermission
export function validatePermission(permissions) {
  if (!permissions) return false;
  if (Array.isArray(permissions)) {
    // accept empty array
    if (permissions.length === 0) return true;
    // accept array of string only
    if (
      permissions.length > 0 &&
      permissions.every((permission) => typeof permission === "string")
    ) {
      const result = [];
      for (const permission of permissions) {
        // all the items are allowed
        if (userPermissions.includes(permission)) {
          result.push(permission);
        }
      }
      return result.length === permissions.length;
    }
    return false;
  }
  return false;
}
// validate add user permission payload
export const validateAddUserPermissionsPayload = async (payload) => {
  const { organization_id, user_id, username, role, permissions } = payload;
  const trimmedOrgId = organization_id ? organization_id.trim() : null;
  const trimmedUserId = user_id ? user_id.trim() : null;
  // if the organization id is missing
  if (!trimmedOrgId) return "Organization Id is required.";

  // if the user id is missing
  if (!trimmedUserId) return "User Id is required.";
  // Find a valid user
  const validUser = await User.findOne({
    _id: user_id,
    is_deleted: false,
    is_active: true,
  }).exec();
  // if No valid user found
  if (!validUser) return "No active user found.";
  // the email is invalid
  if (!validateUserName(username)) return "Username must be alphanumeric with no spaces or special characters";
  // check for valid user role
  if (!userRoles.includes(role)) return "Invalid user role.";
  // check for valid user permissions
  if (!validatePermission(permissions))
    return "User permissions are not allowed.";
  return false;
};

// validate Update user permission payload
export const validateUpdateUserPermissionsPayload = async (payload) => {
  const { user_id, permissions } = payload;
  const trimmedUserId = user_id ? user_id.trim() : null;

  // if the user id is missing
  if (!trimmedUserId) return "User Id is required.";
  // Find a active user
  const activeUser = await User.findOne({
    _id: user_id,
    is_deleted: false,
    is_active: true,
  }).exec();
  // if No active user found
  if (!activeUser) return "No active user found.";
  // check for valid user permissions
  if (!validatePermission(permissions)) return "Invalid user permissions.";
  return false;
};
