export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) return next(err);

  let status = err.statusCode || 500;
  let message = status === 500 ? "Internal server error." : err.message;

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  if (err.code === 11000) {
    status = 409;
    message = "A record with that value already exists.";
  }

  if (err.name === "CastError") {
    status = 400;
    message = "Invalid resource id.";
  }

  res.status(status).json({
    success: false,
    message
  });
}
