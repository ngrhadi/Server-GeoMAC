exports.errorResponse = (res, message, statusCode = 500, error = {}) => {
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      statusCode,
      message,
      error,
    },
  });
};
