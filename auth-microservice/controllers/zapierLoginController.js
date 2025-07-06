import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import dotEnv from "dotenv";
import axios from "axios";

dotEnv.config(); // allow .env file to load
// organization View Api endpoint for service and zapier
const orgEndpoint =
  process.env.ORGANIZATION_API_ENDPOINT_URL + "/api/admin/organization/itself";
// Login With zapier API key only
export const loginWithZapierApiKey = asyncHandler(async (req, res) => {
  const apiKey = req.body.api_key;
  if (!apiKey) {
    return res.status(400).json({ message: "API key is required." });
  }

  try {
    // Find the requested Organization
    const zapRes = await axios.get(orgEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
    });

    if (!zapRes.data || !zapRes.data.org) {
      // if no Organization found
      return res.status(404).json({ message: "No account found." });
    }
    // Pulling out the organization
    const { org: organization } = zapRes?.data;
    // generate a JWT for zapier
    const zapToken = jwt.sign(
      {
        organization_id: organization._id,
        organization_name: organization.public_name,
        organization_email: organization.email,
      },
      process.env.ZAPIER_JWT_SECRET
    );
    // Send the response back
    return res.status(200).json({
      message: "Successfully logged-in.",
      org: {
        organization_id: organization._id,
        organization_name: organization.public_name,
      },
      token: zapToken,
    });
  } catch (err) {
    console.log("Error from loginWithZapierApiKey: ", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
