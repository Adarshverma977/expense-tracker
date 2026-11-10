const AppError = require("../utils/AppError");

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Zod validation errors
  if (err.name === "ZodError") {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    error = new AppError("Request validation failed", 400, errors);
  }

  // Mongoose validation errors
  else if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));

    error = new AppError("Database validation failed", 400, errors);
  }

  // Invalid MongoDB ObjectId
  else if (err.name === "CastError") {
    error = new AppError("Invalid resource identifier", 400);
  }

  // MongoDB duplicate key error
  else if (err.code === 11000) {
    error = new AppError("Resource already exists", 409);
  }

  // Multer file upload errors
  else if (err.name === "MulterError") {
    const multerErrors = {
      LIMIT_FILE_SIZE: ["CSV file exceeds the maximum allowed size.", 413],
      LIMIT_FILE_COUNT: ["Only one CSV file can be uploaded at a time.", 400],
      LIMIT_UNEXPECTED_FILE: [
        "Unexpected file field. Upload a valid CSV file.",
        400,
      ],
      LIMIT_FIELD_COUNT: ["Too many form fields.", 400],
      LIMIT_PART_COUNT: ["Too many multipart form parts.", 400],
    };

    const [message, statusCode] = multerErrors[err.code] || [
      "CSV file upload failed.",
      400,
    ];

    error = new AppError(message, statusCode);
  }

  // Invalid JWT
  else if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid authentication token", 401);
  }

  // Expired JWT
  else if (err.name === "TokenExpiredError") {
    error = new AppError("Authentication token expired", 401);
  }

  // Invalid JSON request body
  else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    error = new AppError("Invalid JSON request body", 400);
  }

  // Unexpected errors
  else if (!(err instanceof AppError)) {
    console.error("Unexpected error:", err);

    error = new AppError("Internal Server Error", 500);
  }

  const response = {
    success: false,
    message:
      error.statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message,
    status: error.status,
  };

  // Include field-level validation errors
  if (error.errors) {
    response.errors = error.errors;
  }

  // Stack trace only in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorMiddleware;
