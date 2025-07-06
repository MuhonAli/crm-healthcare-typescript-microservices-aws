export const generateSMSHistoryFilters = (query) => {
  const filters = {};

  for (let key in query) {
    // omit the following keys from the filter as they are handled by the main function
    if (
      [
        "page",
        "limit",
        "search",
        "sort_by",
        "inbound",
        "is_scheduled",
        "canceled_schedule",
      ].includes(key)
    )
      continue;
    if (key === "send_at") {
      filters[key] = { $lte: new Date(query[key]) };
    }
    // add other keys to the filters object
    else {
      filters[key] = { $regex: query[key], $options: "i" };
    }
  }

  if (query.inbound) {
    filters.inbound = query.inbound;
  }
  if (query.is_scheduled) {
    filters.is_scheduled = query.is_scheduled;
  }
  if (query.canceled_schedule) {
    filters.canceled_schedule = query.canceled_schedule;
  }

  return filters;
};
