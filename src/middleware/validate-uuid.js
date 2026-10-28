const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateAccountId(req, res, next) {
  const { accountId } = req.params;

  if (!UUID_REGEX.test(accountId)) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Account ID must be a valid UUID.",
      },
    });
  }

  next();
}