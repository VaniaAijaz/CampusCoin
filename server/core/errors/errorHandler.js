const AppError = require("./AppError");

/**
 * 404 Route Not Found Middleware
 * Converts missing routes into operational AppErrors
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(404, "ERR_SYS_404", `Requested route ${req.method} ${req.originalUrl} was not found on this server.`));
};

/**
 * Global Error-Handling Middleware
 * Intercepts all incoming exceptions and enforces strict security sanitization:
 * - Operational errors return predefined public messages and domain error codes.
 * - System errors log full stack traces securely to the server console ONLY.
 * - Client receives sanitized JSON contract: { success: false, errorCode: "...", message: "..." }
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Transform Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path || "identifier"}: ${err.value}.`;
    error = new AppError(400, "ERR_TX_004", message, true);
  }

  // Transform Mongoose ValidationError
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {})
      .map((val) => val.message)
      .join(", ");
    error = new AppError(400, "ERR_TX_002", messages || "Invalid input data provided.", true);
  }

  // Transform MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {}).join(", ");
    const message = keys
      ? `A record with that ${keys} already exists.`
      : "An account or record with this unique value already exists.";
    error = new AppError(409, "ERR_AUTH_002", message, true);
  }

  // Transform JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError(401, "ERR_AUTH_005", "Invalid session token. Please sign in again.", true);
  }
  if (err.name === "TokenExpiredError") {
    error = new AppError(401, "ERR_AUTH_005", "Session token expired. Please sign in again.", true);
  }

  // 1. OPERATIONAL ERRORS (Known, trusted user/domain errors)
  if (error instanceof AppError && error.isOperational) {
    return res.status(error.statusCode || 400).json({
      success: false,
      errorCode: error.errorCode || "ERR_SYS_400",
      message: error.message || "A validation or operational error occurred.",
    });
  }

  // 2. SYSTEM ERRORS (Unhandled exceptions, third-party API failures, Redis failure)
  // Secure server-only console logging with full stack trace
  const timestamp = new Date().toISOString();
  console.error("\n==================== [CRITICAL SYSTEM ERROR] ====================");
  console.error(`Timestamp : ${timestamp}`);
  console.error(`Endpoint  : ${req.method} ${req.originalUrl}`);
  console.error(`IP        : ${req.ip || req.socket.remoteAddress}`);
  console.error(`Name      : ${err.name || "UnhandledError"}`);
  console.error(`Message   : ${err.message}`);
  if (err.stack) {
    console.error(`Stack     :\n${err.stack}`);
  }
  console.error("=================================================================\n");

  // Zero Data Leakage Contract: Never expose MongoDB trace, internal file paths, or secrets to client
  return res.status(500).json({
    success: false,
    errorCode: "ERR_SYS_500",
    message: "Internal server error.",
  });
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
