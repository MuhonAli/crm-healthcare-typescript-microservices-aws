// Available String Keys:
const allowedStringKeys = [
  "first_name",
  "last_name",
  "gender",
  "pipeline_stage",
  "business_name",
  "phone",
  "time_zone",
  "last_payment_amount",
  "contact_type",
  "email",
  "height",
  "weight",
  "current_weight",
  "nationality",
  "source",
  "last_activity",
  "street_address",
  "state",
  "city",
  "country",
  "postal_code",
];
// Available Boolean Keys:
const allowedBooleanKeys = [
  "is_starred",
  "dnd",
  "dnd_email",
  "dnd_sms",
  "is_deleted",
  "is_valid_phone_number",
];

// Formating CSV data in proper Javascript object
export const formatCSVDataRow = (row) => {
  let formattedRow = {};

  for (let key in row) {
    if (row[key] === "") continue;

    if (allowedStringKeys.includes(key)) {
      formattedRow[key] = row[key];
      continue;
    }
    if (
      allowedBooleanKeys.includes(key) ||
      row[key] === "true" ||
      row[key] === "false"
    ) {
      formattedRow[key] = row[key] === "true" ? true : false;
      continue;
    }

    const keys = key.split("/");
    let currentObj = formattedRow;

    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i];
      if (!currentObj[currentKey]) {
        if (isNumeric(keys[i + 1])) {
          currentObj[currentKey] = [];
        } else {
          currentObj[currentKey] = {};
        }
      }
      currentObj = currentObj[currentKey];
    }

    const finalKey = keys[keys.length - 1];
    if (isNumeric(finalKey)) {
      currentObj.push(row[key]);
    } else {
      currentObj[finalKey] = row[key];
    }
  }

  return formattedRow;
};

function isNumeric(value) {
  return /^\d+$/.test(value);
}

// filter out valid and invalid data
export const filterContactPayload = (contacts) => {
  const invalidPayload = [];
  const validPayload = [];
  for (const contact of contacts) {
    const isValidPayload = isInvalidContactPayload(contact);

    if (!isValidPayload.validity) {
      // got invalid pushed into invalid payload
      invalidPayload.push({
        data: contact,
        message: isValidPayload.message,
      });
      continue;
    }

    validPayload.push(isValidPayload.data);
  }

  return {
    valid: validPayload,
    invalid: invalidPayload,
  };
};

// check format valid payload
export const isInvalidContactPayload = (contactPayload) => {
  const trimedOrganizationId = contactPayload?.organization_id?.trim() || null;
  if (!trimedOrganizationId) {
    return {
      validity: false,
      message: "Organization Id is required.",
    };
  }

  if (contactPayload.first_name) {
    const firstName = contactPayload.first_name.trim();
    if (!firstName) {
      delete contactPayload.first_name;
    }
  }

  if (contactPayload.last_name) {
    const lastName = contactPayload.last_name.trim();
    if (!lastName) {
      delete contactPayload.last_name;
    }
  }

  if (contactPayload.date_of_birth) {
    const validDOB = validateDateOfBirth(contactPayload.date_of_birth);
    if (!validDOB) {
      delete contactPayload.date_of_birth;
    }
  }

  if (contactPayload.gender) {
    const gender = contactPayload.gender.trim();
    if (!gender) {
      delete contactPayload.gender;
    }
  }

  if (contactPayload.age) {
    const validAge = validateAge(contactPayload.age);
    if (!validAge) {
      delete contactPayload.age;
    }
  }

  if (contactPayload.active_campaign) {
    const validCampaign = validateActiveCampaign(
      contactPayload.active_campaign
    );
    if (!validCampaign) {
      delete contactPayload.active_campaign;
    }
  }

  if (contactPayload.pipeline_stage) {
    const pipelineStage = contactPayload.pipeline_stage.trim();
    if (!pipelineStage) {
      delete contactPayload.pipeline_stage;
    }
  }

  if (contactPayload.business_name) {
    const businessName = contactPayload.business_name.trim();
    if (!businessName) {
      delete contactPayload.business_name;
    }
  }

  if (contactPayload.phone) {
    const phone = contactPayload.phone.trim();
    if (!phone) {
      delete contactPayload.phone;
    }
  }

  if (contactPayload.email) {
    const email = contactPayload.email.trim();
    if (!email) return "Email cann't be empty.";
    if (!validateEmail(email)) {
      delete contactPayload.email;
    }
  }

  if (contactPayload.height) {
    const height = contactPayload.height.trim();
    if (!height) {
      delete contactPayload.height;
    }
  }

  if (contactPayload.weight) {
    const weight = contactPayload.weight.trim();
    if (!weight) {
      delete contactPayload.weight;
    }
  }

  if (contactPayload.current_weight) {
    const currentWeight = contactPayload.current_weight.trim();
    if (!currentWeight) {
      delete contactPayload.current_weight;
    }
  }

  if (
    contactPayload.is_valid_phone_number &&
    typeof contactPayload.is_valid_phone_number !== "boolean"
  ) {
    delete contactPayload.is_valid_phone_number;
  }

  if (contactPayload.nationality) {
    const nationality = contactPayload.nationality.trim();
    if (!nationality) {
      delete contactPayload.nationality;
    }
  }

  if (contactPayload.source) {
    const source = contactPayload.source.trim();
    if (!source) {
      delete contactPayload.source;
    }
  }

  if (contactPayload.last_activity) {
    const lastActivity = contactPayload.last_activity.trim();
    if (!lastActivity) {
      delete contactPayload.last_activity;
    }
  }

  if (contactPayload.tags) {
    const validTag = validateTags(contactPayload.tags);
    if (!validTag) {
      delete contactPayload.tags;
    }
  }

  if (contactPayload.notes) {
    const validNote = validateNotes(contactPayload.notes);
    if (!validNote) {
      delete contactPayload.notes;
    }
  }

  if (contactPayload.assigned_to) {
    const assignedTo = contactPayload.assigned_to.trim();
    if (!assignedTo) {
      delete contactPayload.assigned_to;
    }
  }

  if (contactPayload.street_address) {
    const streetAddress = contactPayload.street_address.trim();
    if (!streetAddress) {
      delete contactPayload.street_address;
    }
  }

  if (contactPayload.state) {
    const state = contactPayload.state.trim();
    if (!state) {
      delete contactPayload.state;
    }
  }

  if (contactPayload.city) {
    const city = contactPayload.city.trim();
    if (!city) {
      delete contactPayload.city;
    }
  }

  if (contactPayload.country) {
    const Country = contactPayload.country.trim();
    if (!Country) {
      delete contactPayload.country;
    }
  }

  if (contactPayload.postal_code) {
    const postalCode = contactPayload.postal_code.trim();
    if (!postalCode) {
      delete contactPayload.postal_code;
    }
  }

  if (contactPayload.time_zone) {
    const timeZone = contactPayload.time_zone.trim();
    if (!timeZone) {
      delete contactPayload.time_zone;
    }
  }

  if (contactPayload.last_payment_amount) {
    const LastPaymentAmount = contactPayload.last_payment_amount.trim();
    if (!LastPaymentAmount) {
      delete contactPayload.last_payment_amount;
    }
  }

  if (contactPayload.milestones) {
    const validMilestones = validateTags(contactPayload.milestones);
    if (!validMilestones) {
      delete contactPayload.milestones;
    }
  }

  if (contactPayload.conversation_id) {
    const conversationId = contactPayload.conversation_id.trim();
    if (!conversationId) {
      delete contactPayload.conversation_id;
    }
  }

  if (contactPayload.contact_type) {
    const contactType = contactPayload.contact_type.trim();
    if (!contactType) {
      delete contactPayload.contact_type;
    }
  }

  return {
    validity: true,
    data: contactPayload,
  };
};

// Validate Notes
function validateNotes(notes) {
  // Check if notes is an array
  if (!Array.isArray(notes)) {
    return false; // Invalid type
  }

  if (notes.length > 0) {
    // Iterate through each note object in the array
    for (const note of notes) {
      // Check if note is an object
      if (typeof note !== "object" || note === null) {
        return false; // Invalid type
      }

      const dateObj = new Date(note.note_date);
      // console.log(dateObj, isNaN(dateObj));
      // Check if note has the required properties and their types
      if (
        !note.hasOwnProperty("note") ||
        typeof note.note !== "string" ||
        !note.hasOwnProperty("note_by") ||
        typeof note.note_by !== "string" || // Assuming user_id is a string
        !note.hasOwnProperty("note_date") ||
        isNaN(dateObj)
      ) {
        return false; // Missing or invalid properties
      }
    }
  }

  // If all checks passed, the notes field is valid
  return true;
}

// Validate Tags
function validateTags(tags) {
  return Array.isArray(tags) && tags.every((tag) => typeof tag === "string");
}

// Validate Email
function validateEmail(email) {
  // Regular expression pattern for a basic email format
  var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Check if the email matches the pattern
  return emailPattern.test(email);
}

// Validate active campaign
function validateActiveCampaign(activeCampaign) {
  return (
    Array.isArray(activeCampaign) &&
    activeCampaign.every((campaign) => {
      return (
        typeof campaign === "object" &&
        campaign !== null &&
        campaign.hasOwnProperty("campaign_id") &&
        typeof campaign.campaign_id === "string" &&
        campaign.hasOwnProperty("campaign_type") &&
        typeof campaign.campaign_type === "string"
      );
    })
  );
}

// Validate Age
function validateAge(age) {
  // Convert the input to a number
  age = parseInt(age, 10);

  // Check if age is a positive integer
  if (isNaN(age) || age < 0) {
    return false; // Invalid age
  }

  // If all checks passed, the age is valid
  return true;
}

// Validate DOB
function validateDateOfBirth(dateString) {
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

export { validateTags };
