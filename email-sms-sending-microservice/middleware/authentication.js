import axios from "axios";
import qs from "qs";
import dotEnv from "dotenv";
import { scopeMaps } from "../config/userPermissions.js";

dotEnv.config(); // allow .env file to load
// Auth Service Url
const authServiceUrlEndpoint =
  process.env.AUTH_SERVICE_BASE_URL + "/api/user/me";
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
    // console.log(hydraResponse.data.active, hydraPayload);
    // if hydra denied for requested scope
    if (!hydraResponse.data.active) {
      return res.status(401).json({ message: "Permission denied" });
    }

    // Search for user N permission data
    const resData = await axios.get(authServiceUrlEndpoint, {
      headers: {
        Authorization: token,
      },
    });

    const { me, permission } = resData?.data?.data;

    if (!me || !permission || !Array.isArray(permission) || !permission.includes(scope)) {
      return res.status(401).json({ message: "Permission Denied" });
    }

    req.user = {
      id: me._id,
      organization_id: me.organization_id,
      username: me.username,
      first_name: me.first_name,
      work_phone: me.work_phone,
      work_phone_extension: me.work_phone_extension,
      email: me.email,
      role: me.role,
      is_active: me.is_active,
      profile_pic_url: me.profile_pic_url,
      permissions: permission,
    };
    next();
  } catch (err) {
    console.log("Error from verifyAuthenticUser: ", err);
    return res.status(401).json({ message: "Permission Denied" });
  }
}

// Has permission to access EmailSMSsending
export const authenticUserToAccessEmailSMSsending = (req, res, next) => {
  const scope = scopeMaps["/email-sms"];
  return verifyAuthenticUser(req, res, next, scope);
};
