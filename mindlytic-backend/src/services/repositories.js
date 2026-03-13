import { randomUUID } from "node:crypto";
import { normalizeEmail } from "../lib/email.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeCourseName = (value) => value.trim().replace(/\s+/g, " ").toLowerCase();

const createCourseRecord = ({ name, category, level, durationHours, tags = [] }) => {
  const trimmedName = name.trim().replace(/\s+/g, " ");

  return {
    name: trimmedName,
    normalizedName: normalizeCourseName(trimmedName),
    category: category?.trim() || null,
    level: level?.trim() || null,
    durationHours: Number.isFinite(durationHours) ? durationHours : null,
    tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
  };
};

const toPublicDocument = (document) => {
  if (!document) return null;
  const { _id, normalizedName, ...rest } = document;
  return {
    id: _id ? _id.toString() : rest.id,
    ...rest,
  };
};

const nowIso = () => new Date().toISOString();

const clone = (value) => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

export const createRepositories = ({ db, logger }) => {
  const memoryStore = {
    courses: [],
    subscriptions: [],
  };

  const coursesCollection = db?.collection("courses");
  const subscriptionsCollection = db?.collection("subscriptions");

  const listCourses = async ({ search = "", limit = 50, sort = "asc" }) => {
    const normalizedSearch = search.trim();
    const direction = sort === "desc" ? -1 : 1;

    if (coursesCollection) {
      const filter = normalizedSearch
        ? { name: { $regex: escapeRegExp(normalizedSearch), $options: "i" } }
        : {};

      const courses = await coursesCollection.find(filter).sort({ name: direction }).limit(limit).toArray();
      return courses.map(toPublicDocument);
    }

    const lowered = normalizedSearch.toLowerCase();
    const filtered = memoryStore.courses.filter((course) =>
      normalizedSearch ? course.name.toLowerCase().includes(lowered) : true,
    );

    const sorted = filtered.sort((a, b) =>
      direction === 1 ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );

    return clone(sorted.slice(0, limit));
  };

  const addCourse = async ({ name, category, level, durationHours, tags = [] }) => {
    const now = nowIso();
    const course = {
      ...createCourseRecord({ name, category, level, durationHours, tags }),
      createdAt: now,
      updatedAt: now,
    };

    if (coursesCollection) {
      const existingCourse = await coursesCollection.findOne({
        $or: [
          { normalizedName: course.normalizedName },
          { name: { $regex: `^${escapeRegExp(course.name)}$`, $options: "i" } },
        ],
      });

      if (existingCourse) {
        const error = new Error("Course already exists");
        error.statusCode = 409;
        error.course = toPublicDocument(existingCourse);
        throw error;
      }

      try {
        const result = await coursesCollection.insertOne(course);
        return toPublicDocument({ _id: result.insertedId, ...course });
      } catch (error) {
        if (error?.code === 11000) {
          const existingDuplicate = await coursesCollection.findOne({
            $or: [
              { normalizedName: course.normalizedName },
              { name: { $regex: `^${escapeRegExp(course.name)}$`, $options: "i" } },
            ],
          });
          const duplicateError = new Error("Course already exists");
          duplicateError.statusCode = 409;
          duplicateError.course = toPublicDocument(existingDuplicate);
          throw duplicateError;
        }
        throw error;
      }
    }

    const existingCourse = memoryStore.courses.find(
      (record) => record.normalizedName === course.normalizedName,
    );
    if (existingCourse) {
      const error = new Error("Course already exists");
      error.statusCode = 409;
      error.course = toPublicDocument(existingCourse);
      throw error;
    }

    const record = { id: randomUUID(), ...course };
    memoryStore.courses.push(record);
    return toPublicDocument(record);
  };

  const subscribe = async ({ email, name = "", source = "web", ip = "", userAgent = "" }) => {
    const normalized = normalizeEmail(email);
    const now = nowIso();

    if (subscriptionsCollection) {
      const existing = await subscriptionsCollection.findOne({ normalizedEmail: normalized });
      if (existing?.status === "active") {
        return { status: "already_subscribed", subscription: toPublicDocument(existing) };
      }

      if (existing && existing.status !== "active") {
        await subscriptionsCollection.updateOne(
          { _id: existing._id },
          {
            $set: {
              status: "active",
              name: name || existing.name || "",
              source,
              ip,
              userAgent,
              updatedAt: now,
              unsubscribedAt: null,
            },
          },
        );
        const updated = await subscriptionsCollection.findOne({ _id: existing._id });
        return { status: "reactivated", subscription: toPublicDocument(updated) };
      }

      const subscription = {
        email: normalized,
        normalizedEmail: normalized,
        name: name.trim(),
        source,
        status: "active",
        ip,
        userAgent,
        createdAt: now,
        updatedAt: now,
        unsubscribedAt: null,
      };

      try {
        const result = await subscriptionsCollection.insertOne(subscription);
        return {
          status: "created",
          subscription: toPublicDocument({ _id: result.insertedId, ...subscription }),
        };
      } catch (error) {
        if (error?.code === 11000) {
          logger.warn({ email: normalized }, "Duplicate subscription creation blocked by unique index.");
          return { status: "already_subscribed", subscription: null };
        }
        throw error;
      }
    }

    const existing = memoryStore.subscriptions.find((item) => item.normalizedEmail === normalized);
    if (existing?.status === "active") {
      return { status: "already_subscribed", subscription: clone(existing) };
    }

    if (existing && existing.status !== "active") {
      existing.status = "active";
      existing.name = name || existing.name || "";
      existing.source = source;
      existing.ip = ip;
      existing.userAgent = userAgent;
      existing.updatedAt = now;
      existing.unsubscribedAt = null;
      return { status: "reactivated", subscription: clone(existing) };
    }

    const subscription = {
      id: randomUUID(),
      email: normalized,
      normalizedEmail: normalized,
      name: name.trim(),
      source,
      status: "active",
      ip,
      userAgent,
      createdAt: now,
      updatedAt: now,
      unsubscribedAt: null,
    };

    memoryStore.subscriptions.push(subscription);
    return { status: "created", subscription: clone(subscription) };
  };

  const getSubscriptionStatus = async ({ email }) => {
    const normalized = normalizeEmail(email);

    if (subscriptionsCollection) {
      const subscription = await subscriptionsCollection.findOne({ normalizedEmail: normalized });
      if (!subscription) {
        return { exists: false, subscribed: false, status: "not_found", subscription: null };
      }
      return {
        exists: true,
        subscribed: subscription.status === "active",
        status: subscription.status,
        subscription: toPublicDocument(subscription),
      };
    }

    const subscription = memoryStore.subscriptions.find((item) => item.normalizedEmail === normalized);
    if (!subscription) {
      return { exists: false, subscribed: false, status: "not_found", subscription: null };
    }

    return {
      exists: true,
      subscribed: subscription.status === "active",
      status: subscription.status,
      subscription: clone(subscription),
    };
  };

  const unsubscribe = async ({ email }) => {
    const normalized = normalizeEmail(email);
    const now = nowIso();

    if (subscriptionsCollection) {
      const subscription = await subscriptionsCollection.findOne({ normalizedEmail: normalized });
      if (!subscription) {
        return { status: "not_found", subscription: null };
      }

      if (subscription.status === "unsubscribed") {
        return { status: "already_unsubscribed", subscription: toPublicDocument(subscription) };
      }

      await subscriptionsCollection.updateOne(
        { _id: subscription._id },
        {
          $set: {
            status: "unsubscribed",
            updatedAt: now,
            unsubscribedAt: now,
          },
        },
      );

      const updated = await subscriptionsCollection.findOne({ _id: subscription._id });
      return { status: "unsubscribed", subscription: toPublicDocument(updated) };
    }

    const subscription = memoryStore.subscriptions.find((item) => item.normalizedEmail === normalized);
    if (!subscription) {
      return { status: "not_found", subscription: null };
    }

    if (subscription.status === "unsubscribed") {
      return { status: "already_unsubscribed", subscription: clone(subscription) };
    }

    subscription.status = "unsubscribed";
    subscription.updatedAt = now;
    subscription.unsubscribedAt = now;
    return { status: "unsubscribed", subscription: clone(subscription) };
  };

  return {
    listCourses,
    addCourse,
    subscribe,
    getSubscriptionStatus,
    unsubscribe,
  };
};
