import axios from "axios";
import qs from "qs";
import dotEnv from "dotenv";
import { scopeMaps } from "../config/userPermissions.js";
import UserPermission from "../models/userPermissionModel.js";
import jwt from "jsonwebtoken";
dotEnv.config(); // allow .env file to load

const hydraServerEndpoint =
  process.env.HYDRA_ADMIN_URL + "/admin/oauth2/introspect";

async function verifyAuthenticUser(req, res, next, scope) {
  const token = req.headers["authorization"];
  let tokenWithoutBearer = null;
  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }
  if (token && token.startsWith("Bearer ")) {
    // Remove the "Bearer " keyword and extract the token
    tokenWithoutBearer = token.split(" ")[1];
  }

  const hydraPayload = {
    token: tokenWithoutBearer
  };

  // Convert the object to x-www-form-urlencoded format
  const xWwwFormUrlencoded = qs.stringify(hydraPayload);
  try {
    // get Response from Hydra
    const hydraResponse = await axios.post(
      hydraServerEndpoint,
      xWwwFormUrlencoded,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // if hydra denied for requested scope
    if (!hydraResponse.data.active) {
      return res.status(401).json({ message: "Permission denied" });
    }

    // Search for user N permission data
    const permission = await UserPermission.findOne({
      username: hydraResponse.data.sub,
      is_deleted: false,
    });

    if (!permission) {
      return res.status(401).json({ message: "Permission Denied" });
    }

    if (!permission.permissions.includes(scope)) {
      return res.status(401).json({ message: "Permission Denied" })
    }

    // console.log(permission.permissions.includes(scope), scope)

    req.user = {
      id: permission.user_id,
      organization_id: permission.organization_id,
      username: permission.username,
      role: permission.role,
      permissions: permission.permissions,
    };
    next();
  } catch (err) {
    console.log("Error from verifyAuthenticUser: ", err);
    return res.status(401).json({ message: "Permission Denied" });
  }
}

// To get the admin with zapier token
async function verifyZapierToken(req, res, next) {
  const token = req.headers["authorization"];
  let tokenWithoutBearer = null;
  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }
  if (token && token.startsWith("Bearer ")) {
    // Remove the "Bearer " keyword and extract the token
    tokenWithoutBearer = token.split(" ")[1];
  }


  try {
    /// Verify Token validity
    jwt.verify(
      tokenWithoutBearer,
      process.env.ZAPIER_JWT_SECRET,
      (err, orgData) => {
        if (err) {
          // if the token is invalid
          return res.status(403).json({ message: "Invalid Token", org: null });
        }
        // console.log(orgData)
        // set the req user data
        req.user = orgData;
        return next();
      }
    );

  } catch (err) {
    console.log("Error from verifyAuthenticUser: ", err);
    return res.status(401).json({ message: "Permission Denied" });
  }
}

// add user by admin or super admin only
export const hasPermissionToAddUser = (req, res, next) => {
  const scope = scopeMaps["/auth/sign-up"];
  return verifyAuthenticUser(req, res, next, scope);
};
// update user permission by admin only
export const hasPermissionToUpdateUserPermission = (req, res, next) => {
  const scope = scopeMaps["/user/permission"];
  return verifyAuthenticUser(req, res, next, scope);
};
// Has permission to view user permissions
export const isvalidForViewPermissionWithEmail = (req, res, next) => {
  const scope = scopeMaps["/user/permission"];
  return verifyAuthenticUser(req, res, next, scope);
};
// identifying request user
export const identifyRequestUser = (req, res, next) => {
  const scope = scopeMaps["/user"];
  return verifyAuthenticUser(req, res, next, scope);
};

// authorize user
export const authorizeUser = (req, res, next) => {
  const scope = scopeMaps["/user/me"];
  return verifyAuthenticUser(req, res, next, scope);
};

// authorize zapier token 
export const authorizedZapierToken = (req, res, next) => {
  return verifyZapierToken(req, res, next);
}

export async function verifyAuthenticEmrUser(req, res, next) {
 
  const token = req.headers["authorization"];

  let zapierTokenWithoutBearer = null;
  
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token missing", org: null });
  }

  if (token && token.startsWith("Bearer ")) {
    zapierTokenWithoutBearer = token.split(" ")[1];
  }

  try {
    const decoded = jwt.verify(zapierTokenWithoutBearer, process.env.ZAPIER_JWT_SECRET);
 
    if (!decoded) {
      return res.status(403).json({ message: "Invalid Token", org: null });
    }
    req.user = decoded;
    return next();
  } catch (err) {
    console.log("Error from verifyAuthenticEmrUser: ", err);
    return res.status(401).json({ message: "Permission Denied", org: null });
  }
} 

