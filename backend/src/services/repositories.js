import { normalizeEmail } from "../lib/email.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeCourseName = (value) => value.trim().replace(/\s+/g, " ").toLowerCase();
const normalizeMediaKey = (value = "") => value.trim().replace(/\s+/g, " ").toLowerCase();
const normalizeSnippetContent = (value = "") => String(value).trim();
const normalizeConversationTitle = (value = "") => String(value || "").trim().replace(/\s+/g, " ");
const normalizeConversationMessageText = (value = "") => String(value || "").trim();
const MAX_CONVERSATION_MESSAGES = 80;

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

const normalizeDocumentId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.$oid === "string") {
    return value.$oid;
  }
  if (typeof value.toString === "function") {
    return value.toString();
  }
  return "";
};

const toPublicDocument = (document) => {
  if (!document) return null;
  const { _id, normalizedName, ...rest } = document;
  return {
    id: _id ? normalizeDocumentId(_id) : rest.id,
    ...rest,
  };
};

const toPublicMediaDocument = (document) => {
  const item = toPublicDocument(document);
  if (!item) return null;

  // Prevent returning heavy raw content blobs from legacy media records.
  delete item.data;
  delete item.binary;
  delete item.bytes;
  delete item.buffer;

  return item;
};

const toPublicSnippetDocument = (document) => {
  const item = toPublicDocument(document);
  if (!item) return null;

  delete item.ownerKey;
  delete item.normalizedContent;

  return item;
};

const createMediaRecord = ({ name = "", url, type = "generic", alt = "", tags = [] }) => {
  const normalizedUrl = String(url || "").trim();
  const normalizedName = String(name || "").trim().replace(/\s+/g, " ");

  return {
    name: normalizedName || null,
    url: normalizedUrl,
    type: String(type || "generic").trim().toLowerCase() || "generic",
    alt: String(alt || "").trim(),
    tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    normalizedKey: normalizeMediaKey(normalizedUrl || normalizedName),
  };
};

const createSnippetRecord = ({ ownerKey, title = "", content }) => {
  const normalizedTitle = String(title || "").trim().replace(/\s+/g, " ");
  const normalizedContent = normalizeSnippetContent(content);

  return {
    id: generateId(),
    ownerKey: String(ownerKey || "").trim(),
    title: normalizedTitle || `${normalizedContent.slice(0, 56)}${normalizedContent.length > 56 ? "..." : ""}`,
    content: normalizedContent,
    normalizedContent,
  };
};

const sanitizeConversationMessages = (messages = []) =>
  messages
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      text: normalizeConversationMessageText(message?.text || ""),
      createdAt: typeof message?.createdAt === "string" && message.createdAt.trim() ? message.createdAt : nowIso(),
    }))
    .filter((message) => message.text.length > 0)
    .slice(-MAX_CONVERSATION_MESSAGES);

const compactConversationTitle = (value = "", fallback = "New chat") => {
  const normalized = normalizeConversationTitle(value);
  if (!normalized) return fallback;
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
};

const deriveConversationTitle = ({ title = "", messages = [] }) => {
  const fromInput = compactConversationTitle(title, "");
  if (fromInput) return fromInput;
  const firstUserPrompt = messages.find((message) => message.role === "user")?.text || messages[0]?.text || "";
  return compactConversationTitle(firstUserPrompt, "New chat");
};

const toPublicAiConversationSummary = (document) => {
  const item = toPublicDocument(document);
  if (!item) return null;
  const messages = Array.isArray(item.messages) ? item.messages : [];

  delete item.ownerUid;
  delete item.ownerEmail;
  delete item.ownerName;
  delete item.messages;

  return {
    ...item,
    messageCount: messages.length,
    lastMessageAt: messages[messages.length - 1]?.createdAt || item.updatedAt || item.createdAt,
  };
};

const toPublicAiConversation = (document) => {
  const item = toPublicDocument(document);
  if (!item) return null;
  const messages = Array.isArray(item.messages) ? item.messages : [];

  delete item.ownerUid;
  delete item.ownerEmail;
  delete item.ownerName;

  return {
    ...item,
    messages: messages.map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      text: String(message?.text || ""),
      createdAt: typeof message?.createdAt === "string" && message.createdAt.trim() ? message.createdAt : nowIso(),
    })),
  };
};

const nowIso = () => new Date().toISOString();
const generateId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const clone = (value) => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

export const createRepositories = ({ db, logger }) => {
  const memoryStore = {
    courses: [],
    media: [],
    subscriptions: [],
    ttsSnippets: [],
    aiConversations: [],
  };

  const coursesCollection = db?.collection("courses");
  const mediaCollection = db?.collection("media");
  const subscriptionsCollection = db?.collection("subscriptions");
  const ttsSnippetsCollection = db?.collection("tts_snippets");
  const aiConversationsCollection = db?.collection("ai_conversations");

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

    const record = { id: generateId(), ...course };
    memoryStore.courses.push(record);
    return toPublicDocument(record);
  };

  const listMedia = async ({ type = "", limit = 50, sort = "desc" }) => {
    const normalizedType = String(type || "").trim().toLowerCase();
    const direction = sort === "asc" ? 1 : -1;

    if (mediaCollection) {
      const filter = normalizedType ? { type: normalizedType } : {};
      const media = await mediaCollection
        .find(filter)
        .sort({ createdAt: direction })
        .limit(limit)
        .toArray();
      return media.map(toPublicMediaDocument);
    }

    const filtered = memoryStore.media.filter((item) =>
      normalizedType ? item.type === normalizedType : true,
    );
    const sorted = filtered.sort((a, b) =>
      direction === 1
        ? String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
        : String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
    return clone(sorted.slice(0, limit));
  };

  const addMedia = async ({ name = "", url, type = "generic", alt = "", tags = [] }) => {
    const now = nowIso();
    const media = {
      ...createMediaRecord({ name, url, type, alt, tags }),
      createdAt: now,
      updatedAt: now,
    };

    if (mediaCollection) {
      const existingMedia = await mediaCollection.findOne({
        normalizedKey: media.normalizedKey,
      });

      if (existingMedia) {
        const error = new Error("Media already exists");
        error.statusCode = 409;
        error.media = toPublicMediaDocument(existingMedia);
        throw error;
      }

      try {
        const result = await mediaCollection.insertOne(media);
        return toPublicMediaDocument({ _id: result.insertedId, ...media });
      } catch (error) {
        if (error?.code === 11000) {
          const duplicate = await mediaCollection.findOne({
            normalizedKey: media.normalizedKey,
          });
          const duplicateError = new Error("Media already exists");
          duplicateError.statusCode = 409;
          duplicateError.media = toPublicMediaDocument(duplicate);
          throw duplicateError;
        }
        throw error;
      }
    }

    const existingMedia = memoryStore.media.find(
      (record) => record.normalizedKey === media.normalizedKey,
    );
    if (existingMedia) {
      const error = new Error("Media already exists");
      error.statusCode = 409;
      error.media = toPublicMediaDocument(existingMedia);
      throw error;
    }

    const record = { id: generateId(), ...media };
    memoryStore.media.push(record);
    return toPublicMediaDocument(record);
  };

  const listTtsSnippets = async ({ ownerKey, limit = 6 }) => {
    const normalizedOwnerKey = String(ownerKey || "").trim();
    const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(20, limit)) : 6;

    if (ttsSnippetsCollection) {
      const snippets = await ttsSnippetsCollection
        .find({ ownerKey: normalizedOwnerKey })
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .toArray();

      return snippets.map(toPublicSnippetDocument);
    }

    const snippets = memoryStore.ttsSnippets
      .filter((item) => item.ownerKey === normalizedOwnerKey)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    return clone(snippets.slice(0, safeLimit).map(toPublicSnippetDocument));
  };

  const addTtsSnippet = async ({ ownerKey, title = "", content }) => {
    const now = nowIso();
    const snippet = {
      ...createSnippetRecord({ ownerKey, title, content }),
      createdAt: now,
      updatedAt: now,
    };

    if (ttsSnippetsCollection) {
      const existingSnippet = await ttsSnippetsCollection.findOne({
        ownerKey: snippet.ownerKey,
        normalizedContent: snippet.normalizedContent,
      });

      if (existingSnippet) {
        const error = new Error("Snippet already exists");
        error.statusCode = 409;
        error.snippet = toPublicSnippetDocument(existingSnippet);
        throw error;
      }

      try {
        await ttsSnippetsCollection.insertOne(snippet);
        return toPublicSnippetDocument(snippet);
      } catch (error) {
        if (error?.code === 11000) {
          const duplicate = await ttsSnippetsCollection.findOne({
            ownerKey: snippet.ownerKey,
            normalizedContent: snippet.normalizedContent,
          });

          const duplicateError = new Error("Snippet already exists");
          duplicateError.statusCode = 409;
          duplicateError.snippet = toPublicSnippetDocument(duplicate || snippet);
          throw duplicateError;
        }
        throw error;
      }
    }

    const existingSnippet = memoryStore.ttsSnippets.find(
      (record) =>
        record.ownerKey === snippet.ownerKey &&
        record.normalizedContent === snippet.normalizedContent,
    );
    if (existingSnippet) {
      const error = new Error("Snippet already exists");
      error.statusCode = 409;
      error.snippet = toPublicSnippetDocument(existingSnippet);
      throw error;
    }

    memoryStore.ttsSnippets.push(snippet);
    return toPublicSnippetDocument(snippet);
  };

  const removeTtsSnippet = async ({ ownerKey, id }) => {
    const normalizedOwnerKey = String(ownerKey || "").trim();
    const normalizedId = String(id || "").trim();

    if (ttsSnippetsCollection) {
      const result = await ttsSnippetsCollection.deleteOne({
        ownerKey: normalizedOwnerKey,
        id: normalizedId,
      });

      return { removed: result.deletedCount > 0 };
    }

    const before = memoryStore.ttsSnippets.length;
    memoryStore.ttsSnippets = memoryStore.ttsSnippets.filter(
      (item) => !(item.ownerKey === normalizedOwnerKey && item.id === normalizedId),
    );
    return { removed: memoryStore.ttsSnippets.length < before };
  };

  const listAiConversations = async ({ ownerUid, limit = 30 }) => {
    const normalizedOwnerUid = String(ownerUid || "").trim();
    const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(50, limit)) : 30;

    if (aiConversationsCollection) {
      const conversations = await aiConversationsCollection
        .find({ ownerUid: normalizedOwnerUid })
        .sort({ updatedAt: -1 })
        .limit(safeLimit)
        .toArray();
      return conversations.map(toPublicAiConversationSummary);
    }

    const conversations = memoryStore.aiConversations
      .filter((item) => item.ownerUid === normalizedOwnerUid)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    return clone(conversations.slice(0, safeLimit).map(toPublicAiConversationSummary));
  };

  const getAiConversation = async ({ ownerUid, id }) => {
    const normalizedOwnerUid = String(ownerUid || "").trim();
    const normalizedId = String(id || "").trim();

    if (aiConversationsCollection) {
      const conversation = await aiConversationsCollection.findOne({
        ownerUid: normalizedOwnerUid,
        id: normalizedId,
      });
      return toPublicAiConversation(conversation);
    }

    const conversation = memoryStore.aiConversations.find(
      (item) => item.ownerUid === normalizedOwnerUid && item.id === normalizedId,
    );
    return clone(toPublicAiConversation(conversation));
  };

  const upsertAiConversation = async ({
    ownerUid,
    ownerEmail = "",
    ownerName = "",
    id = "",
    title = "",
    messages = [],
  }) => {
    const normalizedOwnerUid = String(ownerUid || "").trim();
    const normalizedId = String(id || "").trim();
    const conversationId = normalizedId || generateId();
    const normalizedMessages = sanitizeConversationMessages(messages);
    const now = nowIso();
    const conversationTitle = deriveConversationTitle({
      title,
      messages: normalizedMessages,
    });

    if (aiConversationsCollection) {
      const existing = await aiConversationsCollection.findOne({
        ownerUid: normalizedOwnerUid,
        id: conversationId,
      });

      if (existing) {
        await aiConversationsCollection.updateOne(
          { ownerUid: normalizedOwnerUid, id: conversationId },
          {
            $set: {
              ownerEmail: String(ownerEmail || "").trim().toLowerCase(),
              ownerName: String(ownerName || "").trim(),
              title: conversationTitle,
              messages: normalizedMessages,
              updatedAt: now,
            },
          },
        );
      } else {
        await aiConversationsCollection.insertOne({
          id: conversationId,
          ownerUid: normalizedOwnerUid,
          ownerEmail: String(ownerEmail || "").trim().toLowerCase(),
          ownerName: String(ownerName || "").trim(),
          title: conversationTitle,
          messages: normalizedMessages,
          createdAt: now,
          updatedAt: now,
        });
      }

      const saved = await aiConversationsCollection.findOne({
        ownerUid: normalizedOwnerUid,
        id: conversationId,
      });
      return toPublicAiConversation(saved);
    }

    const existingIndex = memoryStore.aiConversations.findIndex(
      (item) => item.ownerUid === normalizedOwnerUid && item.id === conversationId,
    );

    if (existingIndex >= 0) {
      const existing = memoryStore.aiConversations[existingIndex];
      existing.ownerEmail = String(ownerEmail || "").trim().toLowerCase();
      existing.ownerName = String(ownerName || "").trim();
      existing.title = conversationTitle;
      existing.messages = normalizedMessages;
      existing.updatedAt = now;
      return clone(toPublicAiConversation(existing));
    }

    const record = {
      id: conversationId,
      ownerUid: normalizedOwnerUid,
      ownerEmail: String(ownerEmail || "").trim().toLowerCase(),
      ownerName: String(ownerName || "").trim(),
      title: conversationTitle,
      messages: normalizedMessages,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.aiConversations.push(record);
    return clone(toPublicAiConversation(record));
  };

  const removeAiConversation = async ({ ownerUid, id }) => {
    const normalizedOwnerUid = String(ownerUid || "").trim();
    const normalizedId = String(id || "").trim();

    if (aiConversationsCollection) {
      const result = await aiConversationsCollection.deleteOne({
        ownerUid: normalizedOwnerUid,
        id: normalizedId,
      });
      return { removed: result.deletedCount > 0 };
    }

    const before = memoryStore.aiConversations.length;
    memoryStore.aiConversations = memoryStore.aiConversations.filter(
      (item) => !(item.ownerUid === normalizedOwnerUid && item.id === normalizedId),
    );
    return { removed: memoryStore.aiConversations.length < before };
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
      id: generateId(),
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
    listMedia,
    addMedia,
    listTtsSnippets,
    addTtsSnippet,
    removeTtsSnippet,
    listAiConversations,
    getAiConversation,
    upsertAiConversation,
    removeAiConversation,
    subscribe,
    getSubscriptionStatus,
    unsubscribe,
  };
};
