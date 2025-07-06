import moment from "moment-timezone";
// adding GMT-0 TimeStamps
export const addGMT0Timestamps = (instance, c_at, u_at) => {
  // make a deep clone
  const deepCopy = JSON.parse(JSON.stringify(instance));

  if (c_at) {
    // created at GTM-0
    deepCopy.created_at = moment().tz("Etc/UTC");
  }

  if (u_at) {
    // updated at GTM-0
    deepCopy.updated_at = moment().tz("Etc/UTC");
  }

  return deepCopy;
};

// Take raw mongo instance and remove sensitive properties
export const removeRestrictedProperties = (instance, ...restrictedItems) => {
  const objectForm = instance.toObject(); // convert to object

  for (const item of restrictedItems) {
    delete objectForm[item]; // remove sensitive properties
  }

  return objectForm;
};
