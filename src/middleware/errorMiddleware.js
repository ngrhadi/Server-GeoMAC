async function errorMiddleware(err, req, res, next) {
  let errorMessage = err.message || "internal error";
  let errorStatusCode = err.statusCode || 500;

  await res.status(errorStatusCode).send({
    error: true,
    message: errorMessage,
  });
};

module.exports = { errorMiddleware };
