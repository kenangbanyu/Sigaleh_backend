export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).json({
      message: "Validation error",
      errors: err.errors,
    });
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (err) {
    res.status(400).json({
      message: "Invalid parameter",
      errors: err.errors,
    });
  }
};