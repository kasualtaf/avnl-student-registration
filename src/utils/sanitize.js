import DOMPurify from 'isomorphic-dompurify';

export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  // Use text-only mode for basic fields to completely strip HTML tags
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [] });
};

export const sanitizeForm = (formData) => {
  const sanitized = {};
  for (const key in formData) {
    sanitized[key] = sanitizeString(formData[key]);
  }
  return sanitized;
};
