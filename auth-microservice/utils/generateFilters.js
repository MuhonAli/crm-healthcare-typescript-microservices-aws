export const generateUserPermissionFilters = (req) => {
  const filters = {};

  for (let key in req.query) {
    if (
      key === "page" ||
      key === "limit" ||
      key === "is_deleted" ||
      key === "sort_by" ||
      key === "search"
    ) {
      continue;
    } else {
      filters[key] = { $regex: req.query[key], $options: "i" };
    }
  }

  filters.is_deleted = req.query.is_deleted ? req.query.is_deleted : false;

  filters.organization_id = req.user.organization_id;

  return filters;
};

export const generateUserFilters = (req) => {
  const filters = {};

  for (let key in req.query) {
    if (
      key === "page" ||
      key === "limit" ||
      key === "is_deleted" ||
      key === "sort_by" ||
      key === "search" ||
      key === "is_super_admin" ||
      key === "is_active"
    ) {
      continue;
    } else if (key === "date_of_birth") {
      filters[key] = { $lte: new Date(req.query[key]) };
    } else {
      filters[key] = { $regex: req.query[key], $options: "i" };
    }
  }

  //console.log(req.query.work_phone_no);

  if (req.query.is_active) {
    filters.is_active = req.query.is_active;
  }

  filters.is_deleted = req.query.is_deleted ? req.query.is_deleted : false;

  filters.is_super_admin = false;
  if (req.user.role != "super_admin") {
    filters.organization_id = req.user.organization_id;
  }

  return filters;
};
