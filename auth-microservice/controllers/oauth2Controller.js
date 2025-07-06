import axios from "axios";
import querystring from "querystring";
import User from "../models/userModel.js";
import { hydraAdmin } from "../config/oryhydra.js";
import UserPermission from "../models/userPermissionModel.js";

export const loginController = async (req, res) => {
  const challenge = req.body.login_challenge;
  const userName = req.body.username;
  const password = req.body.password;
  try {
    const response = await User.findByCredential(userName, password);
    if (response) {
      if (response == "no-user") {
        return res.status(404).json({ message: "No user found" });
      } else if (response == "not-matched") {
        return res.status(401).json({ message: "Password does not match" });
      } else if (response == "deactivated") {
        return res.status(403).json({
          message:
            "Your account has been deactivated. Please contact your admin or our support team.",
        });
      } else {
        await hydraAdmin
          .adminGetOAuth2LoginRequest(challenge)
          .then(({ data: body }) => {
            // If hydra was already able to authenticate the user, skip will be true and we do not need to re-authenticate the user.
            if (!body.skip) {
              // Now it's time to grant the login request. You could also deny the request if something went terribly wrong
              // (e.g. your arch-enemy logging in...)
              return hydraAdmin
                .adminAcceptOAuth2LoginRequest(body.challenge, {
                  subject: userName,
                })
                .then(({ data: acceptedData }) => {
                  // All we need to do now is to redirect the user back to hydra!
                  res.status(200).json(acceptedData);
                })
                .catch((err) => {
                  console.log("Error from LoginController(oauth2): ", err);
                });
            } else {
              res.status(200).json({ data: body });
            }
          })
          .catch((error) => {
            console.log("Error from LoginController(oauth2): ", error);
          });
      }
    }
  } catch (e) {
    console.log("Error from userLogin: ", e);
    res.json(e);
  }
};

export const consentController = async (req, res) => {
  const consent_challenge = req.query.consent_challenge;
  if (!consent_challenge) {
    res.status(400).json({ message: "consent_challenge is missing" });
  }
  await hydraAdmin
    .adminGetOAuth2ConsentRequest(consent_challenge)
    .then(async ({ data: body }) => {
      const userName = body.subject;
      try {
        const permission = await UserPermission.findOne({
          username: userName,
          is_deleted: false,
        });

        if (permission.permissions.length > 0) {
          let role = "user"; // later we determine the scopes from permissions
          let scopes = permission.permissions;
          scopes = ["offline_access", "profile", "openid", ...scopes];

          if (!body.skip || !body.client?.skip_consent) {

            return hydraAdmin
              .adminAcceptOAuth2ConsentRequest(consent_challenge, {
                grant_scope: scopes,
              })
              .then(({ data: acceptedConsent }) => {
                res.status(200).json(acceptedConsent);
              })
              .catch((err) => {
                console.log("Something went wrong", err);
              });
          } else {
            console.log("skip consent is true and request got stuck here");
          }
        }
        console.log("disgusting error");
        return res
          .status(404)
          .json({ message: "Something went wrong. No User Permission found." });
      } catch (err) {
        console.log("Error from consentController: ", err);
        return res.status(404).json({ message: "No User Permission found." });
      }
    });
};

export const tokenController = async (req, res) => {
  const code = req.body.code;
  const client_id = req.body.client_id;
  const grant_type = req.body.grant_type;
  const redirect_uri = req.body.redirect_uri;

  let config = {
    client_id: client_id,
    client_secret: "super-secret-value", // I have edited the column (in the database) 'token_endpoint_auth_method' from 'none' to 'client_secret_post'.
    // If it is 'none' then no client_secret is needed to passed. But for this case we must need to pass the client_secret in the body. For my information that, there is an another alternative
    // value 'client_secret_basic', in that case we need to pass the client secret in the header instead of body. Look at this api endpoint payload: https://www.ory.sh/docs/hydra/reference/api#tag/oAuth2/operation/createOAuth2Client
    code: code,
    grant_type: grant_type,
    // grant_type: "authorization_code",
    redirect_uri: redirect_uri,
  };

  const formData = querystring.stringify(config);

  await axios({
    method: "POST",
    url: process.env.HYDRA_PUBLIC_URL + "/oauth2/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: formData,
  })
    .then((response) => {
      res.status(200).json(response.data);
    })
    .catch((err) => {
      console.log("Something went wrong obtaining token", err);
      res.status(500).json({ message: "Internal Server Error!" });
    });
};
