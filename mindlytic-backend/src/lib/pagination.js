const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

export const resolvePagination = (query, defaultPageSize, maxPageSize) => {
  const page = clamp(toInt(query.page, 1), 1, Number.MAX_SAFE_INTEGER);
  const pageSize = clamp(toInt(query.pageSize, defaultPageSize), 1, maxPageSize);
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
};

export const createPaginationMeta = ({ page, pageSize, total }) => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
};
