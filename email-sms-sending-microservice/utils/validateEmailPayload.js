import moment from "moment-timezone";
export const validBodyContentTypes = ["text", "html"];

export const isInvalidEmailPayload = (emailPayload) => {
  let trimmedToEmail, trimmedToName, trimmedFromEmail, trimmedFromName;
  const trimmedSubject = emailPayload.subject
    ? emailPayload.subject.trim()
    : null;
  // validate recipient email id
  if (typeof emailPayload.to === "object") {
    trimmedToEmail = emailPayload.to.email
      ? emailPayload.to.email.trim()
      : null;
    trimmedToName = emailPayload.to.name ? emailPayload.to.name.trim() : null;
  } else {
    return "Recipient's email is invalid.";
  }

  if (!trimmedToEmail || !validateEmail(trimmedToEmail)) {
    return "Recipient's email is invalid.";
  }

  if (emailPayload.to.name && !trimmedToName) {
    return "Recipient's name can not be empty.";
  }

  // validate Sender email id

  if (typeof emailPayload.from === "object") {
    trimmedFromEmail = emailPayload.from.email
      ? emailPayload.from.email.trim()
      : null;
    trimmedFromName = emailPayload.from.name
      ? emailPayload.from.name.trim()
      : null;
  } else {
    return "Verified Sender email is invalid.";
  }

  if (!trimmedFromEmail || !validateEmail(trimmedFromEmail)) {
    return "Verified Sender email is invalid.";
  }

  if (emailPayload.from.name && !trimmedFromName) {
    return "Verified Sender name can not be empty.";
  }

  // validate subject
  if (!trimmedSubject) {
    return "Subject is required.";
  }

  if (emailPayload.send_at) {
    if (!moment(emailPayload.send_at).isValid()) {
      return "Send at is invalid.";
    }
  }

  return null;
};
// Validate Email
function validateEmail(email) {
  // Regular expression pattern for a basic email format
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Check if the email matches the pattern
  return emailPattern.test(email);
}

// Get Event key
export const getEventKeyPayload = (eventPayolad) => {
  if (eventPayolad.event === "processed") {
    return {
      processed: true,
      delivered: false,
      opened: false,
      clicked: false,
      soft_bounced: false,
      hard_bounced: false,
      unsubscribed: false,
      failed: false,
      spamed: false,
      replied: false,
      canceled_schedule: false,
    };
  }
  if (eventPayolad.event === "delivered") {
    return {
      processed: true,
      delivered: true,
      opened: false,
      clicked: false,
      soft_bounced: false,
      hard_bounced: false,
      unsubscribed: false,
      failed: false,
      spamed: false,
      replied: false,
      canceled_schedule: false,
    };
  }
  if (eventPayolad.event === "deferred" || eventPayolad.event === "dropped") {
    return {
      processed: true,
      delivered: false,
      opened: false,
      clicked: false,
      soft_bounced: false,
      hard_bounced: false,
      unsubscribed: false,
      failed: true,
      spamed: false,
      replied: false,
      canceled_schedule: false,
    };
  }
  if (eventPayolad.event === "open") {
    return {
      processed: true,
      delivered: true,
      opened: true,
      clicked: false,
      soft_bounced: false,
      hard_bounced: false,
      unsubscribed: false,
      failed: false,
      spamed: false,
      replied: false,
      canceled_schedule: false,
    };
  }
  if (eventPayolad.event === "click") {
    return {
      processed: true,
      delivered: true,
      opened: true,
      clicked: true,
      soft_bounced: false,
      hard_bounced: false,
      unsubscribed: false,
      failed: false,
      spamed: false,
      replied: false,
      canceled_schedule: false,
    };
  }
  if (eventPayolad.event === "bounce" && eventPayolad.type === "bounce") {
    return {
      processed: true,
      delivered: false,
      opened: false,
      clicked: false,
      soft_bounced: true,
      hard_bounced: false,
      unsubscribed: false,
      failed: true,
      spamed: false,
      replied: false,
      canceled_schedule: false,
    };
  }
  if (eventPayolad.event === "bounce" && eventPayolad.type === "blocked") {
    return {
      processed: true,
      delivered: false,
      opened: false,
      clicked: false,
      soft_bounced: false,
      hard_bounced: true,
      unsubscribed: false,
      failed: true,
      spamed: false,
      replied: false,
      canceled_schedule: false,
    };
  }
  if (eventPayolad.event === "unsubscribed") {
    return {
      processed: true,
      delivered: false,
      opened: false,
      clicked: false,
      soft_bounced: false,
      hard_bounced: false,
      unsubscribed: true,
      failed: true,
      spamed: false,
      replied: false,
      canceled_schedule: false,
    };
  }
  if (eventPayolad.event === "spamreport") {
    return {
      processed: true,
      delivered: true,
      opened: false,
      clicked: false,
      soft_bounced: false,
      hard_bounced: false,
      unsubscribed: true,
      failed: false,
      spamed: true,
      replied: false,
      canceled_schedule: false,
    };
  }

  return null;
};

export const convertReqFilesToAttachments = (files) => {
  return files.map((file) => {
    const base64String = file.buffer.toString("base64");
    return {
      content: base64String,
      filename: file.originalname,
      type: file.mimetype,
    };
  });
};
