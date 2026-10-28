export function errorHandler(err, req, res, next) {
  // If the response has already started, let Express handle the error.
  if (res.headersSent) {
    return next(err);
  }

  const errorResponses = {
    ACCOUNT_NOT_FOUND: {
      status: 404,
      message: "Account not found.",
    },
    DUPLICATE_REFERENCE_ID: {
      status: 409,
      message: "Reference ID already exists for this account.",
    },
    INSUFFICIENT_BALANCE: {
      status: 422,
      message: "Insufficient balance for this transaction.",
    },
  };

  const knownError = errorResponses[err.code];

  if (knownError) {
    return res.status(knownError.status).json({
      error: {
        code: err.code,
        message: knownError.message,
      },
    });
  }

  console.error("Unexpected error:", err.message);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
}