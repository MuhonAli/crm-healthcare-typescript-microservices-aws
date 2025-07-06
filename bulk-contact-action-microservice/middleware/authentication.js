import axios from "axios";
import qs from "qs";
import dotEnv from "dotenv";
import { scopeMaps } from "../config/userPermissions.js";

dotEnv.config(); // allow .env file to load
// Hydra endpoint
const hydraServerEndpoint =
  process.env.HYDRA_ADMIN_URL + "/admin/oauth2/introspect";
// User permission endpoint
const getUserPermissionEndpoint = (username) =>
  process.env.AUTH_SERVICE_BASE_URL + `/api/user/permission/${username}`;

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
    token: tokenWithoutBearer,
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
    const resData = await axios.get(
      getUserPermissionEndpoint(hydraResponse.data.sub),
      {
        headers: {
          Authorization: token,
        },
      }
    );

    const { data: permission } = resData?.data;

    if (!permission || !permission.permissions.includes(scope)) {
      return res.status(401).json({ message: "Permission Denied" });
    }

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

// Has permission to access Bulk Contact
export const authenticUserToAccessBulkContact = (req, res, next) => {
  const scope = scopeMaps["/bulk-contact-action"];
  return verifyAuthenticUser(req, res, next, scope);
};
