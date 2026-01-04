function ApplicationError(code, message) {
  this.code = code;
  this.message = message;
}

export const ERROR_CODES = {
  InvalidData: 1,
  Unauthorized: 2,
  NotFound: 3,
  Forbidden: 4,
  TooManyRequests: 5,
  Unprocessable: 6,
  BadGateway: 7,
  IO_Error: 8,
  Unexpected: 9,
  Not_Implemented: 10,
};

export default {
  INVALID_DATA: (message) =>
    new ApplicationError(ERROR_CODES.InvalidData, message),

  UNAUTHORIZED: (message) =>
    new ApplicationError(ERROR_CODES.Unauthorized, message),

  NOT_FOUND: (message) => new ApplicationError(ERROR_CODES.NotFound, message),

  FORBIDDEN: (message) => new ApplicationError(ERROR_CODES.Forbidden, message),

  TOO_MANY_REQUESTS: (message) =>
    new ApplicationError(ERROR_CODES.TooManyRequests, message),

  UNPROCESSABLE: (message) =>
    new ApplicationError(ERROR_CODES.Unprocessable, message),

  BAD_GATEWAY: (message) =>
    new ApplicationError(ERROR_CODES.BadGateway, message),

  IO_ERROR: (message) => new ApplicationError(ERROR_CODES.IO_Error, message),

  UNEXPECTED: (message) =>
    new ApplicationError(ERROR_CODES.Unexpected, message),

  NOT_IMPLEMENTED: (message) =>
    new ApplicationError(ERROR_CODES.Not_Implemented, message),
};
