export function validateTransactionHistory(req, res, next) {
  const { type, page, limit } = req.query;

  if (
    type !== undefined &&
    type !== "credit" &&
    type !== "debit"
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Type must be either credit or debit.",
      },
    });
  }

  if (
    page !== undefined &&
    (!/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page)))
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Page must be a positive integer.",
      },
    });
  }

  if (
    limit !== undefined &&
    (!/^[1-9]\d*$/.test(limit) ||
      !Number.isSafeInteger(Number(limit)) ||
      Number(limit) > 100)
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Limit must be an integer between 1 and 100.",
      },
    });
  }

  next();
}