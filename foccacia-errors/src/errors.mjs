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
};

export default {
  INVALID_DATA: (message) =>
    new ApplicationError(ERROR_CODES.InvalidData, message),

  UNAUTHORIZED: (message) =>
    new ApplicationError(ERROR_CODES.Unauthorized, message),

  NOT_FOUND: (message) => new ApplicationError(ERROR_CODES.NotFound, message),

  NOT_FORBIDDEN: (message) =>
    new ApplicationError(ERROR_CODES.Forbidden, message),

  RATE_LIMIT: (message) =>
    new ApplicationError(ERROR_CODES.TooManyRequests, message),

  UNPROCESSABLE: (message) =>
    new ApplicationError(ERROR_CODES.Unprocessable, message),

  BAD_GATEWAY: (
    message // No caso de ser impossivel obter informação por culpa da footbal api
  ) => new ApplicationError(ERROR_CODES.BadGateway, message),
};
