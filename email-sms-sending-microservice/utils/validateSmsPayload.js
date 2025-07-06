import moment from "moment-timezone";

// Validate phone number For E164
const validatePhoneNumberE164 = (phoneNumber) => {
  const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
  return phoneNumberRegex.test(phoneNumber);
};

export const isInvalidSMSPayload = (smsPayload) => {
  if (!validatePhoneNumberE164(smsPayload.dst)) {
    return "Invalid E.164 format for destination (dst)";
  }
  if (!validatePhoneNumberE164(smsPayload.src)) {
    return "Invalid E.164 format for source (src)";
  }

  const trimmedText = smsPayload.text ? smsPayload.text.trim() : null;
  if (!trimmedText) {
    return "Text is required";
  }
  if (smsPayload.text.length > 1600) {
    return "Text is too long. Maximum length is 1600 characters";
  }

  if (smsPayload.send_at) {
    if (!moment(smsPayload.send_at).isValid()) {
      return "Send at is invalid.";
    }
  }

  return null;
};

export const isInvalidateIncomingStatus = (savedStatus, incomingStatus) => {
  if (incomingStatus === "queued")
    return "This status has already been reflected in our system.";
  if (
    ["sent", "delivered", "failed"].includes(savedStatus) &&
    incomingStatus === "sent"
  )
    return "This status has already been reflected in our system.";
  return null;
};

export const removeUnnecessaryFields = (fields, item) => {
  const copyOfItem = JSON.parse(JSON.stringify(item));
  for (const field of fields) {
    delete copyOfItem[field];
  }

  return copyOfItem;
};

// format array of sms History
export const formatedSMSHistoryToConversationList = (
  oldsmsHistories,
  newSmsHistoryObj
) => {
  const threads = oldsmsHistories.map((sms) => {
    return removeUnnecessaryFields(["_id", "created_at", "updated_at"], sms);
  });

  const incomingThread = removeUnnecessaryFields(
    ["_id", "created_at", "updated_at"],
    newSmsHistoryObj
  );
  // add new sms to the threads
  threads.push(incomingThread);

  return threads;
};

export const addPlusSignIfNeeded = (str) => {
  if (!str) return "";
  if (str.startsWith("+")) return str;
  return "+" + str;
};

// // Validate phone number For E164
// const validatePhoneNumberE164 = (phoneNumber) => {
//   const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
//   return phoneNumberRegex.test(phoneNumber);
// };

export const isInvalidScheduleCancelPayload = (smsPayload) => {
  if (!validatePhoneNumberE164(smsPayload.dst)) {
    return "Invalid E.164 format for destination (dst)";
  }
  if (!validatePhoneNumberE164(smsPayload.src)) {
    return "Invalid E.164 format for source (src)";
  }

  if (smsPayload.send_at) {
    if (!moment(smsPayload.send_at).isValid()) {
      return "Send at is invalid.";
    }
  }

  const recipientId = smsPayload.recipient_id
    ? smsPayload.recipient_id.trim()
    : null;
  const senderId = smsPayload.sender_id ? smsPayload.sender_id.trim() : null;
  if (!recipientId) return "Recipient Id is required.";
  if (!senderId) return "Sender Id is required.";

  return null;
};
