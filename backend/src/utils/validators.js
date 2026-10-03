/**
 * Validates whether a string is a standard RFC 4122 UUID (v1-v5).
 * @param {string} id
 * @returns {boolean}
 */
function isValidUUID(id) {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

module.exports = {
  isValidUUID
};
