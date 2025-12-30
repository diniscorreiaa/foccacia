export function initSendApplicationError({ ERROR_CODES, logError }) {
  function sendApplicationError(err, req, res, next) {
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
        break;
      default:
        status = 500;
    }

    logError(
      `Application error (${status}) on ${req.method} ${req.path}: ${err.message}`,
      err
    );

    if (req.path.startsWith("/api"))
      return res.status(status).json({ uri: req.path, description: err.message });
    else 
      return res.status(status).render("http-errors", { status, message: err.message} )
  }

  return sendApplicationError;
}
