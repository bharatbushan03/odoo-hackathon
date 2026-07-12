/**
 * @typedef {Object} PaginationMeta
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 * @property {boolean} hasNextPage
 * @property {boolean} hasPreviousPage
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string} message
 * @property {*} data
 * @property {PaginationMeta} [meta]
 * @property {Array} [details]
 */

/**
 * @typedef {Object} JwtPayload
 * @property {string} id
 * @property {string} email
 * @property {string} role
 * @property {string} [departmentId]
 */

/**
 * @typedef {Object} RequestUser
 * @property {string} id
 * @property {string} email
 * @property {string} role
 * @property {string} [departmentId]
 */

module.exports = {};
