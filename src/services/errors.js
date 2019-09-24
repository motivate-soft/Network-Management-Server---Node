const logger = require("../utils/logger");

const ErrorCode = {
  // General
  UNKNOWN: 1, // HTTP 500 - Unknown error occurred.
  SERVICE_UNAVAILABLE: 2, // HTTP 503 - Service unavailable e.g. during maintenance.
  NOT_FOUND: 3, // HTTP 404 - API or page not found.
  // Authentication and Authorization
  UNAUTHENTICATED: 100, // HTTP 401 - User not logged in, require authentication.
  UNAUTHORIZED: 101, // HTTP 403 - Permission denied, user not authorized for the action.
  AUTHENTICATION_FAILED: 102, // HTTP 400 - Username or password is incorrect during login.
  // Resource
  RESOURCE_NOT_FOUND: 200, // HTTP 400 - Resource not found e.g. invalid device ID.
  ALREADY_EXISTS: 201, // HTTP 409 - Attempting to create a resource that already exists.
  DEVICE_OFFLINE: 202, // HTTP 502 - The specific Wanos device is currently offline.
  // URI or Query parameters
  INVALID_ARGUMENT: 300, // HTTP 400 - Client supplied argument is invalid e.g. invalid date range.
  VALIDATION: 400, // HTTP 400 - Validation error on post.
  // RPC
  DEADLINE_EXCEEDED: 600 // HTTP 504 - RPC to Wanos device timed out.
};

const ValidationCode = {
  // All
  REQUIRED: 1,
  INVALID_TYPE: 2,
  UNIQUE: 3,
  // Strings
  MIN_LENGTH: 100,
  MAX_LENGTH: 101,
  COMPARE: 102,
  ENUM: 103,
  EMAIL: 104,
  // Numbers
  MIN_RANGE: 201,
  MAX_RANGE: 202,
  // Password
  INVALID_PASSWORD: 300,
  // DB Relationships
  RESOURCE_NOT_FOUND: 400
};

class ApiErrorField {
  /**
   * @param {string} field
   * @param {string} message
   * @param {number} [code=undefined]
   */
  constructor(field, message, code = undefined) {
    this.field = field;
    this.message = message;
    this.code = code;
  }
}

class ApiError {
  /**
   * @param {number} code
   * @param {string} message
   * @param {ApiErrorField[]} [fieldList=[]]
   */
  constructor(code, message, fieldList = []) {
    this.code = code;
    this.message = message;
    this.fieldList = fieldList;
  }
}

class UnauthenticatedApiError extends ApiError {
  constructor() {
    super(ErrorCode.UNAUTHENTICATED, "Invalid Token");
  }
}

class UnauthorizedApiError extends ApiError {
  constructor(message = "Unauthorized") {
    super(ErrorCode.UNAUTHORIZED, message);
  }
}

class UnknownApiError extends ApiError {
  constructor(message) {
    super(ErrorCode.UNKNOWN, message);
  }
}

class NotFoundApiError extends ApiError {
  constructor() {
    super(ErrorCode.NOT_FOUND, "Not Found.");
  }
}

class InvalidArgumentApiError extends ApiError {
  constructor(field, fieldMessage, fieldCode = undefined) {
    let errorField = new ApiErrorField(field, fieldMessage, fieldCode);
    super(ErrorCode.INVALID_ARGUMENT, "Invalid Argument.", [errorField]);
  }
}

const handleApiError = (res, error) => {
  let apiError = null;
  if (error instanceof ApiError) {
    apiError = error;
  } else {
    let fieldList = !error.fieldList ? [] : error.fieldList.map(x => {
      return new ApiErrorField(x.field, x.message, x.code);
    });
    apiError = new ApiError(error.code, error.message, fieldList);
  }
  let httpStatus = 500;
  switch (apiError.code) {
    case ErrorCode.UNKNOWN: // HTTP 500 - Unknown error occurred.
      httpStatus = 500;
      break;
    case ErrorCode.SERVICE_UNAVAILABLE: // HTTP 503 - Service unavailable e.g. during maintenance.
      httpStatus = 503;
      break;
    case ErrorCode.NOT_FOUND: // HTTP 404 - API or page not found.
      httpStatus = 404;
      break;
    case ErrorCode.UNAUTHENTICATED: // HTTP 401 - User not logged in, require authentication.
      httpStatus = 401;
      break;
    case ErrorCode.UNAUTHORIZED: // HTTP 403 - Permission denied, user not authorized for the action.
      httpStatus = 403;
      break;
    case ErrorCode.AUTHENTICATION_FAILED: // HTTP 400 - Username or password is incorrect during login.
      httpStatus = 400;
      break;
    case ErrorCode.RESOURCE_NOT_FOUND: // HTTP 400 - Resource not found e.g. invalid device ID.
      httpStatus = 400;
      break;
    case ErrorCode.ALREADY_EXISTS: // HTTP 409 - Attempting to create a resource that already exists.
      httpStatus = 409;
      break;
    case ErrorCode.DEVICE_OFFLINE: // HTTP 502 - The specific Wanos device is currently offline.
      httpStatus = 502;
      break;
    case ErrorCode.INVALID_ARGUMENT: // HTTP 400 - Client supplied argument is invalid e.g. invalid date range.
      httpStatus = 400;
      break;
    case ErrorCode.VALIDATION: // HTTP 400 - Validation error on post.
      httpStatus = 400;
      break;
    case ErrorCode.DEADLINE_EXCEEDED: // HTTP 504 - RPC to Wanos device timed out.
      httpStatus = 504;
      break;
    default:
      httpStatus = 500;
  }
  logger.warn(`${apiError.message}: `, apiError);
  return res.status(httpStatus).json({ error: apiError });
};

const handleApiResult = (res, result) => {
  if (result.error) {
    return handleApiError(res, result.error);
  }
  return res.json(result);
};

module.exports = {
  ErrorCode,
  ValidationCode,
  ApiError,
  ApiErrorField,
  UnauthenticatedApiError,
  UnauthorizedApiError,
  UnknownApiError,
  NotFoundApiError,
  InvalidArgumentApiError,
  handleApiError,
  handleApiResult
};