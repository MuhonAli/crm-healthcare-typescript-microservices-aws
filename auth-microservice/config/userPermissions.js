export const userRoles = ["admin", "user"];
export const userPermissions = [
  "appointment",
  "bulk-contact",
  "business-profile-settings",
  "campaign",
  "contact",
  "conversation",
  "dashboard",
  "email-sms-sending",
  "file-mgmt",
  "pipeline",
  "opportunity",
  "organization",
  "self",
  "settings",
  "smartlist",
  "static-template",
  "user",
  "workflow",
];

export const scopeMaps = {
  "/auth/sign-up": "user",
  "/user/permission": "user",
  "/user/change-password": "user",
  "/user/authority": "user",
  "/user/me": "self",
  "/user": "user",
  "/user/storeUserFromEmr": "user",
};
