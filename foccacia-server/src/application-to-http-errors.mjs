import { ERROR_CODES } from "./errors.mjs";
import { logError } from "foccacia-utils";

export function sendApplicationError(err, req, res) {
  if (!err || typeof err.code !== "number") {
    logError(`Unhandled error for ${req.method} ${req.path}`, err);
    return res.status(500).json({
      uri: req.path,
      description: "Internal server error",
    });
  }

  let status;
  switch (err.code) {
    case ERROR_CODES.InvalidData:
      status = 400;
      break;
    case ERROR_CODES.Unauthorized:
      status = 401;
      break;
    case ERROR_CODES.NotFound:
      status = 404;
      break;
    case ERROR_CODES.Forbidden:
      status = 403;
      break;
    case ERROR_CODES.Unprocessable:
      status = 422;
      break;
    case ERROR_CODES.TooManyRequests:
      status = 429;
      break;
    case ERROR_CODES.BadGateway:
      status = 502;
    default:
      status = 500;
  }

  logError(
    `Application error (${status}) on ${req.method} ${req.path}: ${err.message}`,
    ""
  );

  return res.status(status).json({
    uri: req.path,
    description: err.message,
  });
}
