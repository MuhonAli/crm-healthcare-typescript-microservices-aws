import asyncHandler from "express-async-handler";
import moment from "moment-timezone";
import UserPermission from "../models/userPermissionModel.js";
import { validateUpdateUserPermissionsPayload } from "../utils/validateUserPermissionPayload.js";
import User from "../models/userModel.js";
import { generateUserPermissionFilters } from "../utils/generateFilters.js";

// Update User Permission
const updateUserPermission = asyncHandler(async (req, res) => {
  // check for request user permission
  const reqUser = req.user;
  if (reqUser.role !== "admin") {
    return res.status(401).json({ message: "Insufficient rights to access this resource." });
  }

  const foundUser = await User.findOne({
    _id: req.body.user_id,
    is_deleted: false,
  });

  if (!foundUser || foundUser.organization_id != reqUser.organization_id) {
    return res.status(404).json({ message: "User not found." });
  }

  // Check if the user payload is valid or not
  const errorMessage = await validateUpdateUserPermissionsPayload(req.body);
  if (errorMessage) {
    // if there is an error, send the error message with 400
    return res.status(400).json({ message: errorMessage });
  }

  try {
    // Update the user permission
    const userPermission = await UserPermission.findOneAndUpdate(
      { user_id: req.body.user_id },
      {
        $set: {
          permissions: req.body.permissions,
          updated_at: moment().tz("Etc/UTC"),
        },
      },
      { new: true }
    );
    // Send back updated response
    res.status(200).json({
      message: "User permissions updated successfully.",
      data: userPermission,
    });
  } catch (err) {
    console.log("Error from updateUserPermission: ", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// View permissions
// const viewPermissions = asyncHandler(async (req, res) => {
//   const permissionId = req.params.permissionId;
//   try {
//     const permission = await UserPermission.findById(permissionId);

//     return res
//       .status(200)
//       .json({ message: "User Permission Deails", data: permission });
//   } catch (err) {
//     console.log("Error from viewPermissions", err);
//     return res.status(404).json({ message: "No User Permission found." });
//   }
// });

// view permission via username 
const viewPermissionWithUsername = asyncHandler(async (req, res) => {
  try {
    // get permission with the username 
    const permission = await UserPermission.findOne({
      username: req.params.username,
      is_deleted: false,
    });
    // if no permission found or  the organization Id does not match
    if (!permission || req.user.organization_id != permission.organization_id) {
      return res.status(404).json({ message: "No user permission found." });
    }

    return res
      .status(200)
      .json({ message: "User permission deails", data: permission });
  } catch (err) {
    console.log("Error from viewPermissionWithUsername", err);
    return res.status(404).json({ message: "No user permission found." });
  }
});

// List of UserPermission
const getUserPermissionList = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  const page = req?.query?.page ? Number(req.query.page) : 1; // Page number (starting from 1)
  const limit = req?.query?.limit ? Number(req.query.limit) : 10; // Number of documents per page
  const sortBy = req?.query?.sort_by ? req.query.sort_by : "-created_at"; // by default Created At descending order.
  const search = req?.query?.search ? req.query.search : "";
  const filters = generateUserPermissionFilters(req);

  // console.log(filters);

  // Create a regular expression for wildcard search
  const regex = new RegExp(`.*${search}.*`, "i"); // "i" for case-insensitive search

  // Calculate the skip value based on the page size and number
  const skip = (page - 1) * limit;
  try {
    const query = UserPermission.find({
      $and: [
        {
          $or: [{ username: { $regex: regex } }],
        },
        filters,
      ],
    })
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    // execute userPermission Query
    const userPermissions = await query.exec();
    // Getting the Total Document Count
    const totalCount = await UserPermission.countDocuments(query.getFilter());

    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };
    return res.status(200).json({
      message: "User permission list",
      data: userPermissions,
      paginationData,
    });
  } catch (err) {
    console.log("Error from getUserPermissionList: ", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

export {
  updateUserPermission,
  // viewPermissions,
  viewPermissionWithUsername,
  getUserPermissionList,
};
