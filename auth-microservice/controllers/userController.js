import bcryptjs from "bcryptjs";
import moment from "moment-timezone";
import asyncHandler from "express-async-handler";
import dotEnv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import User from "../models/userModel.js";
import PasswordReset from "../models/passwordResetModel.js";
import UserPermission from "../models/userPermissionModel.js";
import { userPermissions as adminPermissions } from "../config/userPermissions.js";
import {
  formatAuthorizedUserInformationUpdate,
  formatUpdateUserPayloadForDb,
  formatUserRegPayloadForDb,
  inValidAuthorizedUserInformationPayload,
  isInvalidRegistrationPayload,
  isInvalidResetPasswordPayload,
  isInvalidUserUpdatePayload,
  validatePassword,
} from "../utils/validateRegPayload.js";
import { sendEmailWithResetPasswordToken } from "./sendEmailController.js";
import { generateUserFilters } from "../utils/generateFilters.js";
import {
  addGMT0Timestamps,
  removeRestrictedProperties,
} from "../utils/common-helper.js";

dotEnv.config(); // allow .env file to load


// Register an user
const createUser = asyncHandler(async (req, res) => {
  // check for request user permission
  const reqUser = req.user;
  if (!["super_admin", "admin"].includes(reqUser.role)) {
    // console.log("We are create User c", reqUser);
    return res.status(401).json({ message: "Permission denied." });
  }
  // Check if the user payload is valid or not
  const errorMessage = isInvalidRegistrationPayload(req.body);

  if (errorMessage) {
    // if there is an error, send the error message with 400
    return res.status(400).json({ message: errorMessage });
  }

  try {
    let formattedRegPayload = formatUserRegPayloadForDb(req.body);
    // set new-user role depending on reqUser
    formattedRegPayload.role = reqUser.role == "super_admin" ? "admin" : "user";
    // add created_at & updated_at to GMT-0
    formattedRegPayload = addGMT0Timestamps(formattedRegPayload, true, true);
    // create a new user
    const newUser = new User(formattedRegPayload);
    // save the user
    const userData = await newUser.save();
    // once the user has been saved let's add permissions
    if (userData) {
      // permissions object
      let userPermissionObj = {
        organization_id: userData.organization_id,
        user_id: userData._id,
        username: userData.username,
        role: userData.role,
      };
      // if the role is admin add full permission
      if (userData.role == "admin") {
        userPermissionObj.permissions = [...adminPermissions];
      } else if (userData.role == "user") {
        userPermissionObj.permissions = req.body.permissions;
      }
      // add created_at & updated_at to GMT-0
      userPermissionObj = addGMT0Timestamps(userPermissionObj, true, true);

      const newUserPermission = new UserPermission(userPermissionObj);
      const savedPermission = await newUserPermission.save();

      return res.status(201).json({
        message: "User created",
        data: { user: userData, permissions: savedPermission?.permissions },
      });
    }

    return res.status(500).json({ message: "Something went wrong.", });
  } catch (err) {
    console.log("Error from createUser: ", err);
    if (err.code === 11000 && err.keyPattern.username === 1) {
      return res.status(400).json({
        message: "The User name has already been taken for another user",
      });
    }
    return res.status(500).json({ message: "Internal Server Error." });
  }
});

const userLogin = asyncHandler(async (req, res) => {
  try {
    const response = await User.findByCredential(
      req.body.username,
      req.body.password
    );
    if (response) {
      if (response == "no-user") {
        return res.status(404).json({ message: "No user found" });
      }
      if (response == "not-matched") {
        return res.status(401).json({ message: "Password does not match" });
      }
      if (response == "deactivated") {
        return res.status(403).json({
          message:
            "Your account has been deactivated. Please contact your admin or our support team.",
        });
      }

      if (response == "organization-inactive") {
        return res.status(401).json({ message: "The organization is not active or it does not have proper access" });
      }
      
      return res.json(response);
    }
  } catch (e) {
    console.log("Error from userLogin: ", e);
    res.json(e);
  }
});

// update user information
const updateUserInformation = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  // if the user is not the same user trying to update the user information
  if (req.user.id != userId) {
    return res.status(403).json({
      message: "Insufficient rights to access this resource.",
    });
  }

  const user = await User.findById(userId);
  // if the user is not found or deleted
  if (!user || user.is_deleted) {
    return res.status(404).json({ message: "User not found" });
  }
  // if the user is not active
  if (!user.is_active) {
    return res.status(400).json({
      message: "Deactivated user. Contact your administrator to activate",
    });
  }

  // Check if the user payload is valid or not
  const errorMessage = isInvalidUserUpdatePayload(req.body);

  if (errorMessage) {
    // if there is an error, send the error message with 400
    return res.status(400).json({ message: errorMessage });
  }

  if (req.body.username && req.body.username !== user.username) {
    const userWithSameHandler = await User.findOne({ username: req.body.username });
    // console.log(userWithSameHandler);
    if (userWithSameHandler) {
      return res.status(400).json({ message: "User Name already exists" });
    }
  }

  try {
    // Formate the payload to be saved in the database
    const newuserPayload = formatUpdateUserPayloadForDb(req.body);

    // Update the found user with the new payload
    const updatedUser = await User.findByIdAndUpdate(userId, newuserPayload, {
      new: true,
    });

    return res.status(200).json({ message: "User updated", data: updatedUser });
  } catch (err) {
    console.log("Error from updateUserInformation: ", err);
    return res.status(500).json({ message: "Internal Server Error." });
  }
});

// View a User
const viewUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    // Checking if the user has the right permissions to view the user
    if (
      !user ||
      (req.user.role != "super_admin" && user.is_deleted) ||
      (req.user.role != "super_admin" &&
        user.organization_id != req.user.organization_id) ||
      (req.user.role == "super_admin" && user.role != "admin")
    ) {
      return res.status(404).json({ message: "User not found." });
    }

    // get user permission
    const userPermissions = await UserPermission.findOne({ user_id: userId });
    const userData = removeRestrictedProperties(user, "is_deleted", "password");

    return res.status(200).json({
      message: "User deails",
      data: { ...userData, permissions: userPermissions?.permissions || [] },
    });
  } catch (err) {
    console.log("Error from viewUser", err);
    return res.status(404).json({ message: "User not found." });
  }
});

// Delete A User
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (req.user.id == userId) {
    // It's a suicide attempt.
    return res.status(403).json({
      message: "The suicide attempt is not permitted.",
    });
  }

  // Only admins are allowed to delete
  if (req.user.role != "admin") {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  // Event admin can delete user from there organization only
  const foundUser = await User.findById(userId);
  if (
    !foundUser ||
    foundUser.is_deleted ||
    foundUser.organization_id != req.user.organization_id
  ) {
    return res.status(404).json({ message: "User not found." });
  }

  try {
    // find and delete the user
    const deletedUser = await User.findByIdAndUpdate(userId, {
      $set: {
        is_deleted: true,
        updated_at: moment().tz("Etc/UTC"),
      },
    });

    await deletedUser.save(); // Save the user deletion into DB

    await UserPermission.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          is_deleted: true,
          updated_at: moment().tz("Etc/UTC"),
        },
      },
      { new: true }
    );

    return res.status(200).json({ message: "User is deleted successfully." });
  } catch (err) {
    console.log("Error from deleteUser", err);
    return res.status(500).json({ message: "Internal Server Error." });
  }
});

// Update User information by the Organization or super Admin
const updateUserInformationByAuthority = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  // Only admins are allowed to update
  if (!["super_admin", "admin"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: "insufficient rights to access this resource." });
  }

  const foundUser = await User.findById(userId);
  if (!foundUser) {
    return res.status(404).json({ message: "User not found." });
  }

  // Check if the user payload is valid or not
  const errorMessage = inValidAuthorizedUserInformationPayload(req.body);

  if (errorMessage) {
    // if there is an error, send the error message with 400
    return res.status(400).json({ message: errorMessage });
  }

  const updateUserValue = formatAuthorizedUserInformationUpdate(
    req.body,
    req.user.role
  );
  try {
    await User.findByIdAndUpdate(userId, updateUserValue);

    if (
      req.user.role != "super_admin" && // A super admin can't modify the role from 'admin' to 'user', that's why we are putting this checkpost. Admin can change one user's role from 'admin' to 'user' or 'user' to 'admin'.
      req.body.hasOwnProperty("role") &&
      typeof req.body.role === "string" &&
      ["admin", "user"].includes(req.body.role)
    ) {
      await UserPermission.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            role: req.body.role,
            updated_at: moment().tz("Etc/UTC"),
          },
        }
      );
    }

    return res.status(200).json({ message: "User is updated successfully." });
  } catch (err) {
    console.log("Error from updateUserInformationByAuthority: ", err);
    // E-11000 duplicate key error collection:
    if (err.code === 11000 && err.keyPattern.username) {
      return res.status(400).json({
        message:
          "The provided user name is already associated with another user.",
      });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Change Password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    // if none of the above are present then send back 400
    return res
      .status(400)
      .json({ message: "All password fields are required." });
  }
  // Validate user password
  const invalidPasswordError = validatePassword(newPassword);

  if (invalidPasswordError) {
    return res.status(400).json({ message: invalidPasswordError });
  }

  if (newPassword !== confirmPassword) {
    // if new and confirm password do not match then send back 400
    return res
      .status(400)
      .json({ message: "New and Confirm password does not match." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      // if the user is not found then send back 401 unauthorized
      return res.status(401).json({
        message: "Invalid Token, this token doesn't authorize you any more.",
      });
    }

    const isMatch = await bcryptjs.compare(oldPassword, user.password);
    if (!isMatch) {
      // If the old password doesn't match send back 400
      return res.status(400).json({ message: "Old password doesn't match" });
    }

    // hash password
    const hashedPassword = await bcryptjs.hash(newPassword, 8);
    // Update the password in the database
    await User.findOneAndUpdate(
      { _id: req.user.id },
      { password: hashedPassword, updated_at: moment().tz("Etc/UTC") }
    );

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log("Error from changePassword: ", error);
    return res.status(404).json({ message: "User not found." });
  }
});

// Forget password
const forgetPassword = asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) {
    // if the email is not available send back 400
    res.status(400).json({ message: "Your user name is required" });
  }
  const foundUser = await User.findOne({ username }).exec();
  if (!foundUser) {
    return res
      .status(404)
      .json({ message: "No user found with this user name" });
  }

  try {
    // generate reset password token
    const resetToken = uuidv4();

    // generate front end url to be clicked from the email
    const frontEndUrl =
      process.env.FRONTEND_URL + "/verify-reset-pass-token?rpt=" + resetToken;
    // Send an email to the user with the reset password token
    const sent = await sendEmailWithResetPasswordToken(
      frontEndUrl,
      foundUser.email,
      foundUser.first_name
    );

    if (!sent) {
      return res.status(500).json({ message: "Internal server error" });
    }
    // Check if the password reset token already exists
    const foundPasswordReset = await PasswordReset.findOne({
      user_id: foundUser._id,
    });

    if (foundPasswordReset) {
      // If the password reset token already exists, update it
      await PasswordReset.findOneAndUpdate(
        { user_id: foundUser._id },
        {
          reset_password_token: resetToken,
        },
        { new: true } // Return updated document
      );
    } else {
      // if not, add a new one
      const newPasswordReset = new PasswordReset({
        user_id: foundUser._id,
        username: foundUser.username,
        reset_password_token: resetToken,
      });
      await newPasswordReset.save();
    }

    return res.status(200).json({
      message: "Please check your email to reset your password",
    });
  } catch (e) {
    console.log("Error from forgetPassword: ", e);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset Password with Token
const resetPasswordToken = asyncHandler(async (req, res) => {
  const { rpt, newPassword } = req.body;
  // Check if the reset payload is valid or not
  const errorMessage = isInvalidResetPasswordPayload(req.body);
  if (errorMessage) {
    // if there is an error, send the error message with 400
    return res.status(400).json({ message: errorMessage });
  }
  // try to get the Reset Password wiht the rpt
  const foundResetPass = await PasswordReset.findOne({
    reset_password_token: rpt,
  }).exec();
  // if no resetPass found the rpt is Invalid
  if (!foundResetPass) {
    return res.status(400).json({ message: "Invalid token." });
  }

  try {
    const hashedPassword = await bcryptjs.hash(newPassword, 8);
    // Update the password in the database
    await User.findOneAndUpdate(
      { _id: foundResetPass.user_id },
      {
        password: hashedPassword,
        updated_at: moment().tz("Etc/UTC"),
      },
      { new: true } // Return updated document
    );

    // Update the password reset token in the database
    await PasswordReset.findOneAndUpdate(
      { user_id: foundResetPass.user_id },
      {
        reset_password_token: null,
      },
      { new: true } // Return updated document
    );

    return res
      .status(200)
      .json({ message: "Your password has been updated successfully" });
  } catch (err) {
    console.log("Error from verifyResetPasswordToken: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// List of User
const getUserList = asyncHandler(async (req, res) => {
  const page = req?.query?.page ? Number(req.query.page) : 1; // Page number (starting from 1)
  const limit = req?.query?.limit ? Number(req.query.limit) : 10; // Number of documents per page
  const sortBy = req?.query?.sort_by ? req.query.sort_by : "-created_at"; // by default Created At descending order.
  const search = req?.query?.search ? req.query.search : "";
  const filters = generateUserFilters(req);

  // console.log(filters);

  // Create a regular expression for wildcard search
  const regex = new RegExp(`.*${search}.*`, "i"); // "i" for case-insensitive search

  // Calculate the skip value based on the page size and number
  const skip = (page - 1) * limit;
  try {
    const query = User.find({
      $and: [
        {
          $or: [
            { first_name: { $regex: regex } },
            { last_name: { $regex: regex } },
            { username: { $regex: regex } },
            { email: { $regex: regex } },
          ],
        },
        filters,
      ],
    })
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    // execute user Query
    const users = await query.exec();
    // Getting the Total Document Count
    const totalCount = await User.countDocuments(query.getFilter());

    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };
    res.status(200).json({
      message: "User list",
      data: users,
      paginationData,
    });
  } catch (err) {
    console.log("Error from getUserList: ", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// get My Information
const getMyInformation = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // find the request user by id
    const foundUser = await User.findById(userId);
    if ((!foundUser && !foundUser.is_active) || foundUser.is_deleted) {
      return res.status(404).json({ message: "No user found." });
    }
    // Find this user permission
    const permission = await UserPermission.findOne({ user_id: userId });

    return res.status(200).json({
      message: `Hello ${foundUser.first_name}.`,
      data: {
        me: foundUser,
        permission: permission?.permissions,
      },
    });
  } catch (err) {
    console.log("Error from getMyInformation: ", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

const getAdminInformation = asyncHandler(async (req, res) => {

  try {
    // We are fetching the first admin only 
    const foundAdmin = await User.findOne({
      organization_id: req.user.organization_id,
      role: "admin",
      is_active: true,
      is_deleted: false
    });

    if (!foundAdmin) {
      return res.status(404).json({ message: "No user found." });
    }
    // // Find this user permission
    // const permission = await UserPermission.findOne({ user_id: foundAdmin._id });

    return res.status(200).json({
      message: `Hello ${foundAdmin.first_name}.`,
      data: {
        me: foundAdmin,
        // permission: permission?.permissions,
      },
    });
  } catch (err) {
    console.log("Error from getMyInformation: ", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Restore A User
const restoreUser = asyncHandler(async (req, res) => {
  const userId = req.body.user_id;

  // Only admins are allowed to delete
  if (req.user.id == userId || req.user.role != "admin") {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  // Event admin can restore user from there organization only
  const foundUser = await User.findById(userId);
  if (!foundUser || foundUser.organization_id != req.user.organization_id) {
    return res.status(404).json({ message: "User not found." });
  }

  try {
    // find and restore the user
    const restoredUser = await User.findByIdAndUpdate(userId, {
      $set: {
        is_deleted: false,
        updated_at: moment().tz("Etc/UTC"),
      },
    });

    await restoredUser.save(); // Save the user restore into DB

    await UserPermission.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          is_deleted: false,
          updated_at: moment().tz("Etc/UTC"),
        },
      },
      { new: true }
    );

    return res.status(200).json({ message: "User is restored successfully." });
  } catch (err) {
    console.log("Error from restoreUser: ", err);
    return res.status(500).json({ message: "Internal Server Error." });
  }
});


const storeUserFromEmr = asyncHandler(async (req, res) => { 

  const errorMessage = isInvalidRegistrationPayload(req.body);

  if (errorMessage) {    
    return res.status(400).json({ message: errorMessage });
  }

  try {
    const formatedRegPayload = formatUserRegPayloadForDb(req.body);
    formatedRegPayload.isApiCallFromEmr = true;   
    const newUser = new User(formatedRegPayload); 
    newUser.isApiCallFromEmr = true;  

    const userData = await newUser.save();

    if (userData) {
      const userPermissionObj = {
        organization_id: userData.organization_id,
        user_id: userData._id,
        username: userData.username,
        role: userData.role,
      };
      
      if (userData.role == "admin") {
        userPermissionObj.permissions = [...adminPermissions];
      } else if (userData.role == "user") {
        userPermissionObj.permissions = req.body.permissions;
      }
      const newUserPermission = new UserPermission(userPermissionObj);
      const savedPermission = await newUserPermission.save();

      return res.status(201).json({
        message: "User created",
        data: { user: userData, permissions: savedPermission },
      });
    }

    return res.status(500).json({ message: "Something went wrong." });
  } catch (err) {
    console.log("Error from createUser: ", err);
    if (err.code === 11000 && err.keyPattern.email === 1) {
      return res.status(400).json({
        message: "This email has already been taken for another user",
      });
    }
    res.status(500).json({ message: "Internal Server Error." });
  } 
});


const updateUserFromEmr = asyncHandler(async (req, res) => {
  const emrUserId = req.body.emr_user_id;
  const getUser = await User.find({ emr_user_id: emrUserId });

  if (!getUser || getUser.length === 0 || getUser[0].is_deleted) {
    return storeUserFromEmr(req, res);
  } 
    
  const user = getUser[0];
 
  const userId = getUser[0]._id;

  if (!user || user.is_deleted) {
    return res.status(404).json({ message: "User not found" });
  } 

  if (!user.is_active) {
    return res.status(400).json({
      message: "Deactivated user. Contact your administrator to activate",
    });
  }   

  const errorMessage = isInvalidUserUpdatePayload(req.body);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  } 
  if (req.body.email && req.body.email !== user.email) {
    const userWithSameEmail = await User.findOne({ email: req.body.email });
    if (userWithSameEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
  }
 
  try {
      
    const newuserPayload = formatUpdateUserPayloadForDb(req.body);
    newuserPayload.isApiCallFromEmr = true; 
    const updatedUser = await User.findByIdAndUpdate(userId, newuserPayload, {
      new: true, 
    }); 
     
    res.status(200).json({ message: "User updated", data: updatedUser });
  } catch (err) {
    console.log("Error from updateUserInformation: ", err);
    return res.status(500).json({ message: "Internal Server Error." });
  }
});


export {
  createUser,
  userLogin,
  updateUserInformation,
  viewUser,
  getMyInformation,
  getAdminInformation,
  deleteUser,
  updateUserInformationByAuthority,
  forgetPassword,
  changePassword,
  resetPasswordToken,
  getUserList,
  restoreUser,
  storeUserFromEmr,
  updateUserFromEmr,
};
