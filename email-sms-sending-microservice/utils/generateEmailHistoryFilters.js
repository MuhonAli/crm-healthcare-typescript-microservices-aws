const filterKeys = {
  // avaiable filter keys
  to_email: "to.email",
  to_name: "to.name",
  from_email: "from.email",
  from_name: "from.name",
  subject: "subject",
  current_status: "current_status",
  send_at: "send_at",
};

export const generateEmailHistoryFilters = (query) => {
  const filters = {};

  for (let key in query) {
    // omit the following keys from the filter as they are handled by the main function
    if (["page", "limit", "search", "sort_by", "inbound"].includes(key))
      continue;
    // add other keys to the filters object
    if (key === "send_at") {
      filters[filterKeys[key]] = { $lte: new Date(query[key]) };
    } else {
      filters[filterKeys[key]] = { $regex: query[key], $options: "i" };
    }
  }

  if (query.inbound) {
    filters.inbound = query.inbound;
  }

  return filters;
};