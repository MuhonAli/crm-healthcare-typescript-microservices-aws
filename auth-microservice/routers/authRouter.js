import express from "express";
import {
  createUser,
  userLogin,
  updateUserInformation,
  viewUser,
  deleteUser,
  updateUserInformationByAuthority,
  forgetPassword,
  changePassword,
  resetPasswordToken,
  getUserList,
  getMyInformation,
  restoreUser,
  getAdminInformation,
  storeUserFromEmr,
  updateUserFromEmr,
} from "../controllers/userController.js";
import {
  getUserPermissionList,
  updateUserPermission,
  viewPermissionWithUsername,
} from "../controllers/userPermissionController.js";
import {
  loginController,
  consentController,
  tokenController,
} from "../controllers/oauth2Controller.js";
import {
  authorizeUser,
  authorizedZapierToken,
  hasPermissionToAddUser,
  hasPermissionToUpdateUserPermission,
  identifyRequestUser,
  isvalidForViewPermissionWithEmail,
  verifyAuthenticEmrUser,
} from "../middlewares/authentication.js";
import { loginWithZapierApiKey } from "../controllers/zapierLoginController.js";

const router = express.Router();

//store data from EMR 
router.route("/user/storeUserFromEmr").post(verifyAuthenticEmrUser, storeUserFromEmr);
router.route("/user/updateUserFromEmr").post(verifyAuthenticEmrUser, updateUserFromEmr);

router.route("/auth/sign-up").post(hasPermissionToAddUser, createUser);
router.route("/auth/sign-in").post(userLogin);
router.route("/auth/forget-password").post(forgetPassword);
router.route("/auth/reset-password").post(resetPasswordToken);
// Zapier login only
router.route("/auth/login/with-api-key").post(loginWithZapierApiKey);

router.route("/oauth2/login").post(loginController);
router.route("/oauth2/consent").post(consentController);
router.route("/oauth2/token").post(tokenController);
// get user information
router.route("/user/me").get(authorizeUser, getMyInformation);
// internal use only
router.route("/user/org-admin").get(authorizedZapierToken, getAdminInformation);
router
  .route("/user/permission")
  .put(hasPermissionToUpdateUserPermission, updateUserPermission);
router
  .route("/user/permission/:username")
  .get(isvalidForViewPermissionWithEmail, viewPermissionWithUsername);
router
  .route("/user/permission")
  .get(identifyRequestUser, getUserPermissionList);
router.route("/user/change-password").put(identifyRequestUser, changePassword);
router.route("/user/restore").put(identifyRequestUser, restoreUser);
router
  .route("/user/authority/:userId")
  .put(identifyRequestUser, updateUserInformationByAuthority);
router.route("/user/:userId").put(identifyRequestUser, updateUserInformation);
router.route("/user/:userId").delete(identifyRequestUser, deleteUser);
router.route("/user/:userId").get(identifyRequestUser, viewUser);
router.route("/user").get(identifyRequestUser, getUserList);


export default router;
