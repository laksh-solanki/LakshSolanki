const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const readErrorMessage = async (response) => {
  const json = await safeJson(response);
  const message = json?.error || json?.detail || json?.message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  try {
    const text = await response.text();
    if (text?.trim()) {
      return text.trim().slice(0, 500);
    }
  } catch {
    // Ignore error body parsing failures.
  }

  return `MongoDB Data API request failed with status ${response.status}.`;
};

const withTimeout = async (promiseFactory, timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

export const createMongoDataApiDb = ({
  baseUrl,
  apiKey,
  dataSource,
  database,
  timeoutMs = 8000,
}) => {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl);

  const action = async (name, payload = {}) => {
    const body = {
      dataSource,
      database,
      ...payload,
    };

    const response = await withTimeout(
      (signal) =>
        fetch(`${normalizedBaseUrl}/action/${name}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
            Accept: "application/ejson",
          },
          body: JSON.stringify(body),
          signal,
        }),
      timeoutMs,
    );

    if (!response.ok) {
      const message = await readErrorMessage(response);
      const error = new Error(message);
      error.statusCode = response.status;
      throw error;
    }

    return (await safeJson(response)) || {};
  };

  const createCursor = ({ collection, filter = {} }) => {
    let sort;
    let limit;

    return {
      sort(nextSort = {}) {
        sort = nextSort;
        return this;
      },
      limit(nextLimit) {
        limit = nextLimit;
        return this;
      },
      async toArray() {
        const payload = {
          collection,
          filter,
        };

        if (sort && typeof sort === "object") {
          payload.sort = sort;
        }

        if (Number.isInteger(limit) && limit > 0) {
          payload.limit = limit;
        }

        const result = await action("find", payload);
        return Array.isArray(result.documents) ? result.documents : [];
      },
    };
  };

  return {
    collection(name) {
      const collection = String(name || "").trim();
      if (!collection) {
        throw new Error("MongoDB Data API collection name is required");
      }

      return {
        find(filter = {}) {
          return createCursor({ collection, filter });
        },
        async findOne(filter = {}) {
          const result = await action("findOne", {
            collection,
            filter,
          });
          return result.document || null;
        },
        async insertOne(document) {
          const result = await action("insertOne", {
            collection,
            document,
          });
          return {
            insertedId: result.insertedId || null,
          };
        },
        async updateOne(filter, update) {
          const result = await action("updateOne", {
            collection,
            filter,
            update,
          });
          return {
            matchedCount: Number(result.matchedCount || 0),
            modifiedCount: Number(result.modifiedCount || 0),
            upsertedId: result.upsertedId || null,
          };
        },
        async deleteOne(filter = {}) {
          const result = await action("deleteOne", {
            collection,
            filter,
          });
          return {
            deletedCount: Number(result.deletedCount || 0),
          };
        },
      };
    },
  };
};
