import moment from "moment-timezone";

// Validate phone number For E164
const validatePhoneNumberE164 = (phoneNumber) => {
  phoneNumber = phoneNumber.startsWith("+") ? phoneNumber : "+" + phoneNumber;
  const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
  return phoneNumberRegex.test(phoneNumber);
};



// validating batch schedule
const validateBatchSchedule = (batchSchedule) => {
  if (!Array.isArray(batchSchedule)) {
    return false;
  }

  for (const item of batchSchedule) {
    if (
      !moment(item.start_date_time).isValid() ||
      !moment(item.end_date_time).isValid() ||
      typeof item.batch_quantity !== 'number' ||
      !['hours', 'days', 'months']?.includes(item.repeat_after_type) ||
      typeof item.repeat_after_value !== 'number' ||
      (typeof item.count !== 'number' && item.count !== undefined)
    ) {
      return false;
    }
  }

  return true;
};



// Validate Array of Objects
export const validateArrayOfObjects = (arr) => {
  if (!Array.isArray(arr)) {
    return false; // Input is not an array
  }

  for (let item of arr) {
    // Check if the item is an object and not an array or null
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return false; // Element is not a valid object
    }
  }

  return true; // All elements are valid objects
};

// Validate Array of Strings
export const validateArrayOfStrings = (arr) => {
  if (!Array.isArray(arr)) {
    return false; // Input is not an array
  }

  for (let item of arr) {
    // Check if the item is a string
    if (typeof item !== "string") {
      return false; // Element is not a valid string
    }
  }

  return true; // All elements are valid strings
};
  

// Validate Email
function validateEmail(email) {
    // Regular expression pattern for a basic email format
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
    // Check if the email matches the pattern
    return emailPattern.test(email);
}

// check object or not
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'function';
}


export const isInvalidContactEmailPayload = (contactEmailPayload) => {

    if (contactEmailPayload.organization_id) {
      const organizationId = contactEmailPayload.organization_id.trim();
      if (!organizationId) return "Organization Id can't be empty.";
    }
  
    if (contactEmailPayload.from) {
      const from = isObject(contactEmailPayload.from);
      if (!from) return "From Information can't be empty";
    }

    if (contactEmailPayload.scheduled_date_time) {
      if (!moment(contactEmailPayload.scheduled_date_time).isValid()) {
        return "Schedule Date is invalid.";
      }
    }

    if (contactEmailPayload.contact_id_array) {
      const contactIdArray = validateArrayOfStrings(contactEmailPayload.contact_id_array);
      if (!contactIdArray) return "Contact Id Array is invalid.";
    }
  
    if (contactEmailPayload.subject) {
      const subject = contactEmailPayload.subject.trim();
      if (!subject) return "Subject can't be empty.";
    }
  
    if (contactEmailPayload.content) {
      const content = validateArrayOfObjects(contactEmailPayload.content);
      if (!content) return "Content can't be empty.";
    }
  
    if (contactEmailPayload.operation_type) {
      const operationType = contactEmailPayload.operation_type.trim();
      if (!operationType) return "Operation Type can't be empty.";
    }

    if (contactEmailPayload.hasOwnProperty('batch_schedule')) {
      const batchScheduleData = validateBatchSchedule(contactEmailPayload.batch_schedule);
      if (!batchScheduleData) return "Invalid batch_schedule data";
    }
  
    return null;
};



export const isInvalidContactSmsPayload = (contactSmspayload) => {

  if (contactSmspayload.organization_id) {
    const organizationId = contactSmspayload.organization_id.trim();
    if (!organizationId) return "Organization Id can't be empty.";
  }

  if (contactSmspayload.text) {
    const text = contactSmspayload.text.trim();
    if (!text) return "Sms Body can't be empty";
  }

  if (contactSmspayload.scheduled_date_time) {
    if (!moment(contactSmspayload.scheduled_date_time).isValid()) {
      return "Schedule Date is invalid.";
    }
  }

  if (contactSmspayload.contact_id_array) {
    const contactIdArray = validateArrayOfStrings(contactSmspayload.contact_id_array);
    if (!contactIdArray) return "Contact Id Array is invalid.";
  }

  if (contactSmspayload.src) {
    const src = validatePhoneNumberE164(contactSmspayload.src);
    if (!src) return "Invalid E.164 format for source (src)";
  }

  if (contactSmspayload.operation_type) {
    const operationType = contactSmspayload.operation_type.trim();
    if (!operationType) return "Operation Type can't be empty.";
  }

  if (contactSmspayload.hasOwnProperty('batch_schedule')) {
    const batchScheduleData = validateBatchSchedule(contactSmspayload.batch_schedule);
    if (!batchScheduleData) return "Invalid batch_schedule data";
  }

  return null;
};


// format bulk contact create payload
const formatBulkContactEmailPayload = (req) => {
  const scheduleDate = req.body.scheduled_date_time;
    return {
      organization_id: req.user.organization_id ? req.user.organization_id: undefined, // getting the organization from the request user
      from: req.body.from ? req.body.from : undefined,
      subject: req.body.subject ? req.body.subject : undefined,
      scheduled_date_time: req.body.scheduled_date_time
        ? new Date(getGMTEpochTime({
          send_at: scheduleDate
        }) * 1000)
        : undefined,
      content: req.body.content ? req.body.content : undefined,
      attachments: req.body.attachments ? req.body.attachments : undefined,
      contact_id_array: req.body.contact_id_array ? req.body.contact_id_array : undefined,
      operation_type: req.body.operation_type
        ? req.body.operation_type
        : undefined,
      batch_schedule: req.body.batch_schedule
        ? req.body.batch_schedule
        : [],
      created_at: moment().tz("Etc/UTC"),
      updated_at: moment().tz("Etc/UTC"),
    };
};




// Helper function to get the send_at value
export const getGMTEpochTime = ({ send_at }) => {
let time = send_at ? moment.tz(send_at, "Etc/UTC") : moment().tz("Etc/UTC");
// Convert the Time to Unix time
const unixTime = time.unix();
return unixTime;
};


// format contact create payload
const formatBulkContactSmsPayload = (req) => {
  const scheduleDate = req.body.scheduled_date_time;
  return {
    organization_id: req.user.organization_id, // getting the organization from the request user
    text: req.body.text ? req.body.text : undefined,
    scheduled_date_time: req.body.scheduled_date_time
      ?  new Date(getGMTEpochTime({
        send_at: scheduleDate
      }) * 1000)
      : undefined,
    contact_id_array: req.body.contact_id_array ? req.body.contact_id_array : undefined,
    src: req.body.src,
    operation_type: req.body.operation_type,
    batch_schedule: req.body.batch_schedule
      ? req.body.batch_schedule
      : [],
    created_at: moment().tz("Etc/UTC"),
    updated_at: moment().tz("Etc/UTC"),
  };
};

export {
    validateEmail,
    formatBulkContactEmailPayload,
    formatBulkContactSmsPayload
};