const AppError = require("../utils/AppError");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(new AppError("Request validation failed", 400));
    }

    // Replace request data with validated data
    req.body = result.data.body;
    req.validatedQuery = result.data.query;
    req.validatedParams = result.data.params;

    next();
  };
};

module.exports = validateRequest;
