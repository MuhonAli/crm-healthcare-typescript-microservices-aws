import asyncHandler from "express-async-handler";
import plivo from "plivo";
import dotEnv from "dotenv";
import { countriesAlpha_2_codelist } from "../config/countryMapToAlpha_2.js";

dotEnv.config(); // allow .env file to load

const plivoClient = new plivo.Client(
  process.env.PLIVO_AUTH_ID,
  process.env.PLIVO_AUTH_TOKEN
);
// validate number and return
function validateNumber(input, defaultValue) {
  const parsedNumber = parseInt(input, 10); // Parse the input to an integer

  // Check if the parsedNumber is a valid integer and not NaN
  if (
    !isNaN(parsedNumber) &&
    Number.isInteger(parsedNumber) &&
    parsedNumber > 0
  ) {
    return parsedNumber; // Return the validated integer
  } else {
    return defaultValue; // Return the default value if input is invalid
  }
}

// Generate Plivo number list queries
const generatePlivoNumberQuery = (req) => {
  const queries = {};
  if (req.query.type) queries.type = req.query.type; // string
  if (req.query.number_startswith)
    queries.number_startswith = req.query.number_startswith; // string
  if (req.query.subaccount) queries.subaccount = req.query.subaccount; // String
  if (req.query.alias) queries.alias = req.query.alias; // String
  // services Possible values are: voice,  sms,  mms,  voice,sms,  voice,sms,mms
  if (req.query.services) queries.services = req.query.services; // String
  // cnam_lookup Possible values are: enabled,  disabled
  if (req.query.cnam_lookup) queries.cnam_lookup = req.query.cnam_lookup; // String

  // Renewal_date can be used in these five forms:
  if (req.query.renewal_date) queries.renewal_date = req.query.renewal_date; // String YYYY-MM-DD.
  if (req.query.renewal_date__gt)
    queries.renewal_date__gt = req.query.renewal_date__gt; // String YYYY-MM-DD.
  if (req.query.renewal_date__gte)
    queries.renewal_date__gte = req.query.renewal_date__gte; // String YYYY-MM-DD.
  if (req.query.renewal_date__lt)
    queries.renewal_date__lt = req.query.renewal_date__lt; // String YYYY-MM-DD.
  if (req.query.renewal_date__lte)
    queries.renewal_date__lte = req.query.renewal_date__lte; // String YYYY-MM-DD.

  if (req.query.tendlc_registration_status)
    queries.tendlc_registration_status = req.query.tendlc_registration_status; // String Valid values: unregistered, in_progress, registered
  if (req.query.tendlc_campaign_id)
    queries.tendlc_campaign_id = req.query.tendlc_campaign_id; // String
  if (req.query.toll_free_sms_verification)
    queries.toll_free_sms_verification = req.query.toll_free_sms_verification; // String Valid values: unverified, pending_verification, verified

  queries.limit = validateNumber(req.query.limit, 20); // integer  The maximum number of results that can be fetched is 20. Defaults to 20.
  queries.offset = validateNumber(req.query.offset, 0); // integer  Denotes the number of value items by which the results should be offset. Defaults to 0.

  return queries;
};

// List all my Plivo number
const plivoNumberList = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to view this list
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }
  const filters = generatePlivoNumberQuery(req);

  try {
    // get available phone numbers list
    const phoneNumberList = await plivoClient.numbers.list(filters);

    return res.status(200).json({
      messages: "Numbers fetched successfully",
      data: phoneNumberList,
    });
  } catch (err) {
    console.log("Error form plivoNumberList: ", err);
    return res.status(500).json({ messages: "Internal Server Error." });
  }
});

// ISO 3166 Alpha-2 country codes
const iso3166Alpha2Country = asyncHandler(async (req, res) => {
  try {
    return res.status(200).json({
      message: "ISO 3166 Alpha-2 country codes",
      data: countriesAlpha_2_codelist,
    });
  } catch (err) {
    console.log("Error from iso3166Alpha2Country: ", err);
    return res.status(500).json({ messages: "Internal Server Error." });
  }
});

// Generate available phone number search queries
const generateAvailablePhoneNumberQuery = (req) => {
  const queries = {};
  // if (req.query.country_iso) queries.country_iso = req.query.country_iso; // required, string, The ISO 3166 alpha-2 country code of the country.
  // To see what number types we support in each country, make a get request to the following API endpoint
  // {{cpcrm_email_sms_sending_api_url}}/api/email-sms/iso-3166-country-codes.
  if (req.query.type) queries.type = req.query.type; // string, Filters by the type of the phone number. Allowed values are toll-free, local, mobile, national, and fixed.
  if (req.query.pattern) queries.pattern = req.query.pattern; // string, A pattern to match the phone number with. Phone numbers starting with (numeric country code + pattern) are filtered in. Allowed values are A-Z, 0-9, *, and ?. For example, to search for phone numbers in the US starting with a 415 prefix, specify Pattern = 415. Filtered results will be in the form "1415nnnnnnn"
  if (req.query.npanxx) queries.npanxx = req.query.npanxx; // six-digit integer, Filters local US and CA numbers based on the provided six-digit prefix. The filter is applicable only if the country is US or CA. For example, to search for 1 (737) 977-nnnn, "npanxx" = 737 977. To be used in combination with the local_calling_area filter.
  if (req.query.local_calling_area)
    queries.local_calling_area = req.query.local_calling_area; // boolean if set to true, expands the search results to include phone numbers that are local to the searched npanxx.
  // The filter is only applicable if npanxx is provided. Read more about local calling.
  // Defaults to false. Note: If local_calling_area is set to true, phone numbers in the search results might not match the searched npanxx. All phone numbers in the search results will be in the local calling radius of the searched npanxx.
  if (req.query.region) queries.region = req.query.region; // string min. length is 2, filters by the exact name of a region: for instance, region=Frankfurt. This filter is applicable only when the type is fixed. If no type is provided, type is assumed to be fixed
  if (req.query.services) queries.services = req.query.services; // string, Filters phone numbers that provide the selected services. Allowed values are: voice: Indicates that phone numbers that can receive calls are to be returned.
  //  sms: Indicates that phone numbers that can receive SMS messages are to be returned.
  // mms: Indicates that phone numbers that can receive MMS messages are to be returned.
  // voice,sms: Indicates that phone numbers that can receive both calls and SMS messages are to be returned.
  // voice,sms,mms: Indicates that phone numbers that can receive calls and SMS and MMS messages are to be returned.
  if (req.query.city) queries.city = req.query.city; // string, Filters based on the city name. This filter is applicable only when the type is local.
  if (req.query.lata) queries.lata = req.query.lata; // string, Filters by LATA. This filter is applicable only for US and Canada.
  if (req.query.rate_center) queries.rate_center = req.query.rate_center; // string, Filters by rate center. This filter is applicable only for US and Canada.
  if (req.query.compliance_requirement)
    queries.compliance_requirement = req.query.compliance_requirement; // string, References the Compliance requirements associated with the phone number. {Null} denotes that the phone number does not have any regulatory requirements.

  queries.limit = validateNumber(req.query.limit, 20); // integer  The maximum number of results that can be fetched is 20. Defaults to 20.
  queries.offset = validateNumber(req.query.offset, 0); // integer  Denotes the number of value items by which the results should be offset. Defaults to 0.
  return queries;
};

// Search for available phone numbers
const availableNewPhoneNumbers = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to view this list
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  if (!req.query.country_iso) {
    // if no country code available
    return res
      .status(400)
      .json({ message: "'country_iso' query param is required." });
  }

  try {
    const filters = generateAvailablePhoneNumberQuery(req);
    // get available phone numbers list
    const phoneNumberList = await plivoClient.numbers.search(
      req.query.country_iso,
      filters
    );

    return res.status(200).json({
      messages: "Numbers fetched successfully",
      data: phoneNumberList,
    });
  } catch (err) {
    console.log("Error from availableNewPhoneNumbers: ", err);
    return res.status(500).json({ message: "Internal Server Error." });
  }
});

// Buy Or Rent a new phone number
const rentAPhoneNumber = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to view this list
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  if (!req.body.number) {
    return res
      .status(400)
      .json({ message: "A available number is required to buy." });
  }

  try {
    // buy phone number from Plivo
    const phoneNumber = await plivoClient.numbers.buy(
      req.body.number,
      req.body?.appId
    );

    return res.status(201).json({
      data: phoneNumber,
    });
  } catch (err) {
    console.log("Error from rentAPhoneNumber: ", err);
    return res.status(500).json({ message: "Internal Server Error." });
  }
});

// Unrent a phone number
const unrentAPhoneNumber = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to view this list
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  if (!req.body.number) {
    return res.status(400).json({ message: "Number is required." });
  }

  try {
    // Unrent a rented number
    await plivoClient.numbers.unrent(req.body.number);

    return res.status(200).json({
      message: "Number successfully unrented.",
    });
  } catch (err) {
    console.log("Error from unrentAPhoneNumber: ", err);
    return res.status(500).json({ message: "Internal Server Error." });
  }
});

// View Plivo number Details
const viewPlivoNumberDetails = asyncHandler(async (req, res) => {
  const number = req.params.plivoNumber;
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to view this list
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  try {
    // get Plivo number details
    const plivoNumber = await plivoClient.numbers.get(number);
    if (!plivoNumber) {
      return res.status(404).json({ message: "No Plivo Number found." });
    }

    return res
      .status(200)
      .json({ message: "Number Details", data: plivoNumber });
  } catch (err) {
    console.log("Error from viewPlivoNumberDetails: ", err);
    if (err.status === 404 && err.apiID) {
      return res.status(404).json({ message: "No Plivo Number found." });
    }
    return res.status(500).json({ message: "Internal Server Error." });
  }
});

export {
  plivoNumberList,
  iso3166Alpha2Country,
  availableNewPhoneNumbers,
  rentAPhoneNumber,
  unrentAPhoneNumber,
  viewPlivoNumberDetails,
};
