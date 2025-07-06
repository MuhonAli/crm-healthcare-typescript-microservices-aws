import { validatePermission } from "./validateUserPermissionPayload.js";
import moment from "moment-timezone";

export const isInvalidRegistrationPayload = (userPayload) => {
  const {
    organization_id,
    organization_name,
    username,
    first_name,
    last_name,
    email,
    password,
    job_description,
    date_of_birth,
    work_phone_no,
    role,
    street_address,
    country,
    state,
    city,
    zip_code,
    work_phone_extension,
    home_phone_no,
    home_phone_extension,
    gender,
    profile_pic_url,
    email_signature,
    enable_on_outgoing_msg,
    include_before_text_in_replies,
    additional_info,
    is_active,
    permissions,
    is_emr_data,
    emr_user_id,
    emr_facility_id,
    has_crm_access,
  } = userPayload;

  const trimmedOrgId = organization_id ? organization_id.trim() : null;
  const trimmedOrgName = organization_name ? organization_name.trim() : null;
  const trimmedFirstName = first_name ? first_name.trim() : null;
  const trimmedLastName = last_name ? last_name.trim() : null;
  const invalidPassword = validatePassword(password);
  const trimmedJobDescription = job_description ? job_description.trim() : null;
  const trimmedWorkPhone = work_phone_no ? work_phone_no.trim() : null;
  const trimmedRole = role ? role.trim() : null;
  const trimmedStreetAddress = street_address ? street_address.trim() : null;
  const trimmedCountry = country ? country.trim() : null;
  const trimmedCity = city ? city.trim() : null;
  const trimmedState = state ? state.trim() : null;
  const trimmedZipcode = zip_code ? zip_code.trim() : null;
  if (!trimmedOrgId) {
    return "Organization id is required.";
  }
  if (!trimmedOrgName) {
    return "Organization name is required.";
  }
  if (!validateUserName(username)) {
    return "We want to make sure your username is awesome! Just remember to remove any spaces and keep it within 3 to 50 characters. You're free to use special characters";
  }
  if (!trimmedFirstName) {
    return "First name is required.";
  }
  if (!trimmedLastName) {
    return "Last name is required.";
  }
  if (!validateEmail(email)) {
    return "Invalid email address.";
  }
  if (invalidPassword) {
    return invalidPassword;
  }
  if (!trimmedJobDescription) {
    return "Job description is required."; 
  }
  if (!validateDateOfBirth(date_of_birth)) {
    return "Invalid date of birth.";
  }
  if (!trimmedWorkPhone) {
    return "WorkPhone is required.";
  }
  if (!trimmedRole) {
    return "Role is required.";
  } else if (!["admin", "user"].includes(role)) {
    return "Invalid role.";
  }
  if (!trimmedStreetAddress) {
    return "Street address is required.";
  }
  if (!trimmedCountry) {
    return "Country is required.";
  }
  if (!trimmedCity) {
    return "City is required.";
  }
  if (!trimmedState) {
    return "State is required.";
  }
  if (!trimmedZipcode) {
    return "Zip code is required.";
  }
  if (work_phone_extension) {
    const trimmedExtension = work_phone_extension.trim();
    if (!trimmedExtension) return "Work phone extension can't be empty.";
  }
  if (home_phone_no) {
    const trimmedHomePhoneNo = home_phone_no.trim();
    if (!trimmedHomePhoneNo) return "Home phone number can't be empty.";
  }
  if (home_phone_extension) {
    const trimmedHomeExtension = home_phone_extension.trim();
    if (!trimmedHomeExtension) return "Home phone extension can't be empty.";
  }
  if (gender) {
    const trimmedGender = gender.trim();
    if (!trimmedGender) return "Gender can't be empty.";
  }
  if (profile_pic_url) {
    const trimmedProfilePicUrl = profile_pic_url.trim();
    if (!trimmedProfilePicUrl) return "Profile pic url can't be empty.";
  }
  if (email_signature) {
    const trimmedEmailSignature = email_signature.trim();
    if (!trimmedEmailSignature) return "Email signature can't be empty.";
  }
  if (enable_on_outgoing_msg && typeof enable_on_outgoing_msg !== "boolean") {
    return "Enable signature on outgoing message settings value is invalid.";
  }
  if (
    include_before_text_in_replies &&
    typeof include_before_text_in_replies !== "boolean"
  ) {
    return "Include signature before text in replies settings value is invalid.";
  }
  if (additional_info) {
    const trimmedAdditionalInfo = additional_info.trim();
    if (!trimmedAdditionalInfo) return "Additional info can't be empty.";
  }
  if (is_active && typeof is_active !== "boolean") {
    return "Is active settings value is invalid.";
  }

  if (role == "user" && !validatePermission(permissions)) {
    return "Invalid permissions.";
  }
  return null;
};


// validate userName
function validateUserName(handler) {
  // no empty space allowed, but can be alphanumeric, min 3 to max 50 character long, and specified special characters.
  return /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{3,50}$/.test(handler);
}

// Validate Email
function validateEmail(email) {
  // Regular expression pattern for a basic email format
  var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Check if the email matches the pattern
  return emailPattern.test(email);
}

// Validate Password
function validatePassword(password) {
  // Password criteria
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#\$%\^&\*]/.test(password); // Customize with additional special characters

  // Check if the password meets the criteria
  if (!password) {
    return "Password is required.";
  } else if (password.length < minLength) {
    return "Password should be at least " + minLength + " characters long.";
  } else if (!hasUppercase) {
    return "Password should contain at least one uppercase letter.";
  } else if (!hasLowercase) {
    return "Password should contain at least one lowercase letter.";
  } else if (!hasNumber) {
    return "Password should contain at least one number.";
  } else if (!hasSpecialChar) {
    return "Password should contain at least one special character.";
  }

  // If the password passes all criteria, it's valid
  return false;
}

// Validate DOB
function validateDateOfBirth(dateString) {
  if (!dateString) return false;
  if (dateString.includes("T")) {
    dateString = dateString.split("T")[0];
  }
  // Regular expression for a date in the format YYYY-MM-DD
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  // Check if the input matches the date pattern
  if (!datePattern.test(dateString)) {
    return false; // Invalid format
  }

  // Parse the date components
  const year = parseInt(dateString.substr(0, 4), 10);
  const month = parseInt(dateString.substr(5, 2), 10);
  const day = parseInt(dateString.substr(8, 2), 10);

  // Check if the month is between 1 and 12
  if (month < 1 || month > 12) {
    return false; // Invalid month
  }

  // Check if the day is between 1 and 31 based on the month
  if (day < 1 || day > 31) {
    return false; // Invalid day
  }

  // Check for a realistic year (e.g., not in the future)
  const currentYear = new Date().getFullYear();
  if (year > currentYear) {
    return false; // Year is in the future
  }

  // If all checks passed, the date is valid
  return true;
}

export const formatUserRegPayloadForDb = (regPayload) => {
  return {
    organization_id: regPayload.organization_id,
    organization_name: regPayload.organization_name,
    username: regPayload.username,
    first_name: regPayload.first_name,
    last_name: regPayload.last_name,
    email: regPayload.email,
    password: regPayload.password,
    gender: regPayload.gender ? regPayload.gender : undefined,
    job_description: regPayload.job_description,
    date_of_birth: regPayload.date_of_birth,
    work_phone_no: regPayload.work_phone_no,
    work_phone_extension: regPayload.work_phone_extension
      ? regPayload.work_phone_extension
      : undefined,
    role: regPayload.role,
    street_address: regPayload.street_address,
    country: regPayload.country,
    state: regPayload.state,
    city: regPayload.city,
    zip_code: regPayload.zip_code,
    home_phone_no: regPayload.home_phone_no
      ? regPayload.home_phone_no
      : undefined,
    home_phone_extension: regPayload.home_phone_extension
      ? regPayload.home_phone_extension
      : undefined,
    profile_pic_url: regPayload.profile_pic_url
      ? regPayload.profile_pic_url
      : undefined,
    email_signature: regPayload.email_signature
      ? {
        signature: regPayload.email_signature,
        enable_on_outgoing_msg: regPayload.enable_on_outgoing_msg
          ? regPayload.enable_on_outgoing_msg
          : false,
        include_before_text_in_replies:
          regPayload.include_before_text_in_replies
            ? regPayload.include_before_text_in_replies
            : false,
      }
      : undefined,
    additional_info: regPayload.additional_info
      ? regPayload.additional_info
      : undefined,
    is_active: regPayload?.is_active,
    is_emr_data: regPayload?.is_emr_data,
    emr_user_id: regPayload?.emr_user_id,
    emr_facility_id: regPayload?.emr_facility_id,
    has_crm_access: regPayload?.has_crm_access,
  };
};

export const isInvalidUserUpdatePayload = (userPayload) => {
  const {
    username,
    first_name,
    last_name,
    email,
    job_description,
    date_of_birth,
    work_phone_no,
    street_address,
    country,
    state,
    city,
    zip_code,
    work_phone_extension,
    home_phone_no,
    home_phone_extension,
    gender,
    profile_pic_url,
    email_signature,
    enable_on_outgoing_msg,
    include_before_text_in_replies,
    additional_info,
    is_emr_data,
    emr_user_id, 
    emr_facility_id,
    has_crm_access,
  } = userPayload;


  if (username && !validateUserName(username)) {
    return "We want to make sure your username is awesome! Just remember to remove any spaces and keep it within 3 to 50 characters. You're free to use special characters";
  }

  if (first_name) {
    const trimmedFirstName = first_name.trim();
    if (!trimmedFirstName) {
      return "First name can't be empty.";
    }
  }
  if (last_name) {
    const trimmedLastName = last_name.trim();
    if (!trimmedLastName) {
      return "Last name can't be empty.";
    }
  }

  if (email && !validateEmail(email)) {
    return "Invalid email address.";
  }
  if (job_description) {
    const trimmedJobDescription = job_description.trim();
    if (!trimmedJobDescription) {
      return "Job description can't be empty.";
    }
  }

  if (date_of_birth && !validateDateOfBirth(date_of_birth)) {
    return "Invalid date of birth.";
  }

  if (work_phone_no) {
    const trimmedWorkPhone = work_phone_no.trim();
    if (!trimmedWorkPhone) {
      return "WorkPhone can't be empty.";
    }
  }
  if (street_address) {
    const trimmedStreetAddress = street_address.trim();

    if (!trimmedStreetAddress) {
      return "Street address can't be empty.";
    }
  }
  if (country) {
    const trimmedCountry = country.trim();
    if (!trimmedCountry) {
      return "Country can't be empty.";
    }
  }
  if (city) {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      return "City can't be empty.";
    }
  }
  if (state) {
    const trimmedState = state.trim();
    if (!trimmedState) {
      return "State can't be empty.";
    }
  }
  if (zip_code) {
    const trimmedZipcode = zip_code.trim();

    if (!trimmedZipcode) {
      return "Zip code can't be empty.";
    }
  }

  if (work_phone_extension) {
    const trimmedExtension = work_phone_extension.trim();
    if (!trimmedExtension) return "Work phone extension can't be empty.";
  }
  if (home_phone_no) {
    const trimmedHomePhoneNo = home_phone_no.trim();
    if (!trimmedHomePhoneNo) return "Home phone number can't be empty.";
  }
  if (home_phone_extension) {
    const trimmedHomeExtension = home_phone_extension.trim();
    if (!trimmedHomeExtension) return "Home phone extension can't be empty.";
  }
  if (gender) {
    const trimmedGender = gender.trim();
    if (!trimmedGender) return "Gender can't be empty.";
  }
  if (profile_pic_url) {
    const trimmedProfilePicUrl = profile_pic_url.trim();
    if (!trimmedProfilePicUrl) return "Profile pic url can't be empty.";
  }
  if (email_signature) {
    const trimmedEmailSignature = email_signature.trim();
    if (!trimmedEmailSignature) return "Email signature can't be empty.";
  }
  if (enable_on_outgoing_msg && typeof enable_on_outgoing_msg !== "boolean") {
    return "Enable signature on outgoing message settings value is invalid.";
  }
  if (
    include_before_text_in_replies &&
    typeof include_before_text_in_replies !== "boolean"
  ) {
    return "Include signature before text in replies settings value is invalid.";
  }
  if (additional_info) {
    const trimmedAdditionalInfo = additional_info.trim();
    if (!trimmedAdditionalInfo) return "Additional info can't be empty.";
  }
  return null;
};

export const formatUpdateUserPayloadForDb = (regPayload) => {
  return {
    organization_id: regPayload.organization_id ? regPayload.organization_id : undefined,
    organization_name: regPayload.organization_name ? regPayload.organization_name : undefined,
    username: regPayload.username ? regPayload.username : undefined,
    first_name: regPayload.first_name ? regPayload.first_name : undefined,
    last_name: regPayload.last_name ? regPayload.last_name : undefined,
    email: regPayload.email ? regPayload.email : undefined,
    password: regPayload.password ? regPayload.password : undefined, 
    gender: regPayload.gender ? regPayload.gender : undefined,
    job_description: regPayload.job_description
      ? regPayload.job_description
      : undefined,
    date_of_birth: regPayload.date_of_birth
      ? regPayload.date_of_birth
      : undefined,
    work_phone_no: regPayload.work_phone_no
      ? regPayload.work_phone_no
      : undefined,
    work_phone_extension: regPayload.work_phone_extension
      ? regPayload.work_phone_extension
      : undefined,
    street_address: regPayload.street_address
      ? regPayload.street_address
      : undefined,
    country: regPayload.country ? regPayload.country : undefined,
    state: regPayload.state ? regPayload.state : undefined,
    city: regPayload.city ? regPayload.city : undefined,
    zip_code: regPayload.zip_code ? regPayload.zip_code : undefined,
    home_phone_no: regPayload.home_phone_no
      ? regPayload.home_phone_no
      : undefined,
    home_phone_extension: regPayload.home_phone_extension
      ? regPayload.home_phone_extension
      : undefined,
    profile_pic_url: regPayload.profile_pic_url
      ? regPayload.profile_pic_url
      : undefined,
    email_signature: regPayload.email_signature
      ? {
        signature: regPayload.email_signature,
        enable_on_outgoing_msg: regPayload.enable_on_outgoing_msg
          ? regPayload.enable_on_outgoing_msg
          : false,
        include_before_text_in_replies:
          regPayload.include_before_text_in_replies
            ? regPayload.include_before_text_in_replies
            : false,
      }
      : undefined,
    additional_info: regPayload.additional_info
      ? regPayload.additional_info
      : undefined,
    updatedAt: moment().tz("Etc/UTC"),
    is_emr_data: regPayload.is_emr_data ? regPayload.is_emr_data : undefined,
    emr_user_id: regPayload.emr_user_id ? regPayload.emr_user_id : undefined,
    emr_facility_id: regPayload.emr_facility_id ? regPayload.emr_facility_id : undefined,
    has_crm_access: regPayload.has_crm_access ? regPayload.has_crm_access : false, 
  }; 
};
 
export const inValidAuthorizedUserInformationPayload = (userPayload) => {
  const {
    username,
    first_name,
    last_name,
    email,
    job_description,
    date_of_birth,
    work_phone_no,
    street_address,
    country,
    state,
    city,
    zip_code,
    work_phone_extension,
    home_phone_no,
    home_phone_extension,
    gender,
    profile_pic_url,
    email_signature,
    enable_on_outgoing_msg,
    include_before_text_in_replies,
    additional_info,
  } = userPayload;


  if (username && !validateUserName(username)) {
    return "We want to make sure your username is awesome! Just remember to remove any spaces and keep it within 3 to 50 characters. You're free to use special characters";
  }

  if (first_name) {
    const trimmedFirstName = first_name.trim();
    if (!trimmedFirstName) {
      return "First name can't be empty.";
    }
  }
  if (last_name) {
    const trimmedLastName = last_name.trim();
    if (!trimmedLastName) {
      return "Last name can't be empty.";
    }
  }

  if (email && !validateEmail(email)) {
    return "Invalid email address.";
  }
  if (job_description) {
    const trimmedJobDescription = job_description.trim();
    if (!trimmedJobDescription) {
      return "Job description can't be empty.";
    }
  }

  if (date_of_birth && !validateDateOfBirth(date_of_birth)) {
    return "Invalid date of birth.";
  }

  if (work_phone_no) {
    const trimmedWorkPhone = work_phone_no.trim();
    if (!trimmedWorkPhone) {
      return "WorkPhone can't be empty.";
    }
  }
  if (street_address) {
    const trimmedStreetAddress = street_address.trim();

    if (!trimmedStreetAddress) {
      return "Street address can't be empty.";
    }
  }
  if (country) {
    const trimmedCountry = country.trim();
    if (!trimmedCountry) {
      return "Country can't be empty.";
    }
  }
  if (city) {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      return "City can't be empty.";
    }
  }
  if (state) {
    const trimmedState = state.trim();
    if (!trimmedState) {
      return "State can't be empty.";
    }
  }
  if (zip_code) {
    const trimmedZipcode = zip_code.trim();

    if (!trimmedZipcode) {
      return "Zip code can't be empty.";
    }
  }

  if (work_phone_extension) {
    const trimmedExtension = work_phone_extension.trim();
    if (!trimmedExtension) return "Work phone extension can't be empty.";
  }
  if (home_phone_no) {
    const trimmedHomePhoneNo = home_phone_no.trim();
    if (!trimmedHomePhoneNo) return "Home phone number can't be empty.";
  }
  if (home_phone_extension) {
    const trimmedHomeExtension = home_phone_extension.trim();
    if (!trimmedHomeExtension) return "Home phone extension can't be empty.";
  }
  if (gender) {
    const trimmedGender = gender.trim();
    if (!trimmedGender) return "Gender can't be empty.";
  }
  if (profile_pic_url) {
    const trimmedProfilePicUrl = profile_pic_url.trim();
    if (!trimmedProfilePicUrl) return "Profile pic url can't be empty.";
  }
  if (email_signature) {
    const trimmedEmailSignature = email_signature.trim();
    if (!trimmedEmailSignature) return "Email signature can't be empty.";
  }
  if (enable_on_outgoing_msg && typeof enable_on_outgoing_msg !== "boolean") {
    return "Enable signature on outgoing message settings value is invalid.";
  }
  if (
    include_before_text_in_replies &&
    typeof include_before_text_in_replies !== "boolean"
  ) {
    return "Include signature before text in replies settings value is invalid.";
  }
  if (additional_info) {
    const trimmedAdditionalInfo = additional_info.trim();
    if (!trimmedAdditionalInfo) return "Additional info can't be empty.";
  }

  if (
    userPayload.hasOwnProperty("is_active") &&
    typeof userPayload.is_active !== "boolean"
  ) {
    return "Invalid is_active value";
  }

  if (
    userPayload.hasOwnProperty("is_deleted") &&
    typeof userPayload.is_deleted !== "boolean"
  ) {
    return "Invalid is_deleted value";
  }

  if (
    userPayload.hasOwnProperty("role") &&
    (typeof userPayload.role !== "string" ||
      !["admin", "user"].includes(userPayload.role))
  ) {
    return "Role value is invalid";
  }

  return null;
};

export const formatAuthorizedUserInformationUpdate = (
  userPayload,
  req_user_role
) => {
  // A super admin can't change an 'admin' (of any organization) to 'user'. Only one of the admins of that specific organization can modify a user role from 'user' to 'admin' or vice versa.
  // That's why we need to check whether this API request comes from any super admin or not. If from super admin, then he can update this user entity's several information except the role, role remains 'admin'.
  // Note that, if the requester is a super-admin and payload user data is for an user, the controller will block this call before coming into here.
  let payload_role = undefined;
  if (
    userPayload.hasOwnProperty("role") &&
    typeof userPayload.role === "string" &&
    ["admin", "user"].includes(userPayload.role)
  ) {
    if (req_user_role != "super_admin") {
      payload_role = userPayload.role;
    }
  }

  return {
    username: userPayload.username ? userPayload.username : undefined,
    first_name: userPayload.first_name ? userPayload.first_name : undefined,
    last_name: userPayload.last_name ? userPayload.last_name : undefined,
    email: userPayload.email ? userPayload.email : undefined,
    gender: userPayload.gender ? userPayload.gender : undefined,
    job_description: userPayload.job_description
      ? userPayload.job_description
      : undefined,
    date_of_birth: userPayload.date_of_birth
      ? userPayload.date_of_birth
      : undefined,
    work_phone_no: userPayload.work_phone_no
      ? userPayload.work_phone_no
      : undefined,
    work_phone_extension: userPayload.work_phone_extension
      ? userPayload.work_phone_extension
      : undefined,
    street_address: userPayload.street_address
      ? userPayload.street_address
      : undefined,
    country: userPayload.country ? userPayload.country : undefined,
    state: userPayload.state ? userPayload.state : undefined,
    city: userPayload.city ? userPayload.city : undefined,
    zip_code: userPayload.zip_code ? userPayload.zip_code : undefined,
    home_phone_no: userPayload.home_phone_no
      ? userPayload.home_phone_no
      : undefined,
    home_phone_extension: userPayload.home_phone_extension
      ? userPayload.home_phone_extension
      : undefined,
    profile_pic_url: userPayload.profile_pic_url
      ? userPayload.profile_pic_url
      : undefined,
    email_signature: userPayload.email_signature
      ? {
        signature: userPayload.email_signature,
        enable_on_outgoing_msg: userPayload.enable_on_outgoing_msg
          ? userPayload.enable_on_outgoing_msg
          : false,
        include_before_text_in_replies:
          userPayload.include_before_text_in_replies
            ? userPayload.include_before_text_in_replies
            : false,
      }
      : undefined,
    additional_info: userPayload.additional_info
      ? userPayload.additional_info
      : undefined,
    is_active:
      userPayload.hasOwnProperty("is_active") &&
        typeof userPayload.is_active === "boolean"
        ? userPayload.is_active
        : undefined,
    is_deleted:
      userPayload.hasOwnProperty("is_deleted") &&
        typeof userPayload.is_deleted === "boolean"
        ? userPayload.is_deleted
        : undefined,
    role: payload_role,
    updatedAt: moment().tz("Etc/UTC"),
  };
};

// validate reset password payload
export const isInvalidResetPasswordPayload = (payload) => {
  const { rpt, newPassword, confirmPassword } = payload;
  const trimmedRpt = rpt ? rpt.trim() : null;
  if (!trimmedRpt) {
    return "Reset password token (rpt) is required.";
  }
  if (!newPassword) {
    return "New password is required.";
  }
  if (!confirmPassword) {
    return "Confirm password is required.";
  }

  const invalidPassword = validatePassword(newPassword);
  if (invalidPassword) return invalidPassword;

  if (newPassword !== confirmPassword) {
    return "New and confirm password doesn't match.";
  }

  return false;
};

export { validatePassword, validateUserName };
