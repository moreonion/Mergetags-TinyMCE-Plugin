export const escapeForRegex = (sourceString) => String(sourceString).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Escape text for safe inclusion into an HTML attribute value (double-quoted). */
export const attrEscape = (attributeString) =>
  String(attributeString)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
