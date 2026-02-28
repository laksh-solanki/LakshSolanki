import { randomUUID } from "node:crypto";
import { DEFAULT_COURSES, DEFAULT_HOBBIES } from "../constants/defaultData.js";
import { normalizeEmail } from "../lib/email.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPublicDocument = (document) => {
  if (!document) return null;
  const { _id, ...rest } = document;
  return {
    id: _id ? _id.toString() : rest.id,
    ...rest,
  };
};

const nowIso = () => new Date().toISOString();

const createSeededRecords = (items, prefix) => {
  const now = nowIso();
  return items.map((item, index) => ({
    id: `${prefix}-${index + 1}`,
    ...item,
    createdAt: now,
    updatedAt: now,
  }));
};

const clone = (value) => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

export const createRepositories = ({ db, logger }) => {
  const memoryStore = {
    courses: createSeededRecords(DEFAULT_COURSES, "course"),
    hobbies: createSeededRecords(DEFAULT_HOBBIES, "hobby"),
    subscriptions: [],
  };

  const coursesCollection = db?.collection("courses");
  const hobbiesCollection = db?.collection("hobbies");
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
      name: name.trim(),
      category: category?.trim() || "General",
      level: level?.trim() || "Beginner",
      durationHours: Number.isFinite(durationHours) ? durationHours : 20,
      tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      createdAt: now,
      updatedAt: now,
    };

    if (coursesCollection) {
      const result = await coursesCollection.insertOne(course);
      return toPublicDocument({ _id: result.insertedId, ...course });
    }

    const record = { id: randomUUID(), ...course };
    memoryStore.courses.push(record);
    return clone(record);
  };

  const listHobbies = async ({ search = "", limit = 50, sort = "asc" }) => {
    const normalizedSearch = search.trim();
    const direction = sort === "desc" ? -1 : 1;

    if (hobbiesCollection) {
      const filter = normalizedSearch
        ? { name: { $regex: escapeRegExp(normalizedSearch), $options: "i" } }
        : {};

      const hobbies = await hobbiesCollection.find(filter).sort({ name: direction }).limit(limit).toArray();
      return hobbies.map(toPublicDocument);
    }

    const lowered = normalizedSearch.toLowerCase();
    const filtered = memoryStore.hobbies.filter((hobby) =>
      normalizedSearch ? hobby.name.toLowerCase().includes(lowered) : true,
    );

    const sorted = filtered.sort((a, b) =>
      direction === 1 ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );

    return clone(sorted.slice(0, limit));
  };

  const addHobby = async ({ name, type, frequency }) => {
    const now = nowIso();
    const hobby = {
      name: name.trim(),
      type: type?.trim() || "General",
      frequency: frequency?.trim() || "Weekly",
      createdAt: now,
      updatedAt: now,
    };

    if (hobbiesCollection) {
      const result = await hobbiesCollection.insertOne(hobby);
      return toPublicDocument({ _id: result.insertedId, ...hobby });
    }

    const record = { id: randomUUID(), ...hobby };
    memoryStore.hobbies.push(record);
    return clone(record);
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

  const listSubscriptions = async ({ page, pageSize, status = "", search = "" }) => {
    const normalizedStatus = status.trim();
    const normalizedSearch = search.trim();

    if (subscriptionsCollection) {
      const filter = {};
      if (normalizedStatus) {
        filter.status = normalizedStatus;
      }
      if (normalizedSearch) {
        const regex = { $regex: escapeRegExp(normalizedSearch), $options: "i" };
        filter.$or = [{ email: regex }, { name: regex }];
      }

      const total = await subscriptionsCollection.countDocuments(filter);
      const data = await subscriptionsCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();

      return { data: data.map(toPublicDocument), total };
    }

    const loweredSearch = normalizedSearch.toLowerCase();
    let filtered = memoryStore.subscriptions;

    if (normalizedStatus) {
      filtered = filtered.filter((item) => item.status === normalizedStatus);
    }

    if (normalizedSearch) {
      filtered = filtered.filter((item) => {
        const emailMatch = item.email.toLowerCase().includes(loweredSearch);
        const nameMatch = item.name?.toLowerCase().includes(loweredSearch);
        return emailMatch || nameMatch;
      });
    }

    const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (page - 1) * pageSize;
    const data = sorted.slice(start, start + pageSize);

    return {
      data: clone(data),
      total: sorted.length,
    };
  };

  const getStats = async () => {
    if (db) {
      const [courseCount, hobbyCount, subscriptionCount, statusRows] = await Promise.all([
        coursesCollection.countDocuments({}),
        hobbiesCollection.countDocuments({}),
        subscriptionsCollection.countDocuments({}),
        subscriptionsCollection.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray(),
      ]);

      const statusCounts = {
        active: 0,
        unsubscribed: 0,
      };

      for (const row of statusRows) {
        statusCounts[row._id] = row.count;
      }

      return {
        totals: {
          courses: courseCount,
          hobbies: hobbyCount,
          subscriptions: subscriptionCount,
        },
        subscriptionsByStatus: statusCounts,
      };
    }

    const statusCounts = memoryStore.subscriptions.reduce(
      (acc, subscription) => {
        acc[subscription.status] = (acc[subscription.status] || 0) + 1;
        return acc;
      },
      { active: 0, unsubscribed: 0 },
    );

    return {
      totals: {
        courses: memoryStore.courses.length,
        hobbies: memoryStore.hobbies.length,
        subscriptions: memoryStore.subscriptions.length,
      },
      subscriptionsByStatus: statusCounts,
    };
  };

  return {
    listCourses,
    addCourse,
    listHobbies,
    addHobby,
    subscribe,
    getSubscriptionStatus,
    unsubscribe,
    listSubscriptions,
    getStats,
  };
};
