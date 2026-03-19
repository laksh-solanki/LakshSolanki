const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (value) => value?.trim().toLowerCase() || "";

export const isValidEmail = (value) => EMAIL_REGEX.test(normalizeEmail(value));
