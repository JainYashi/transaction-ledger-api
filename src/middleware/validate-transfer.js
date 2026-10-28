export function validateTransfer(req, res, next) {
  const body = req.body;

  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body must be a JSON object.",
      },
    });
  }

  const allowedFields = [
    "from_account_id",
    "to_account_id",
    "amount",
    "reference_id",
    "description",
  ];

  const unexpectedFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unexpectedFields.length > 0) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: `Unexpected field(s): ${unexpectedFields.join(", ")}.`,
      },
    });
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    typeof body.from_account_id !== "string" ||
    !uuidRegex.test(body.from_account_id) ||
    typeof body.to_account_id !== "string" ||
    !uuidRegex.test(body.to_account_id)
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Both account IDs must be valid UUIDs.",
      },
    });
  }

  if (body.from_account_id === body.to_account_id) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Source and destination accounts must be different.",
      },
    });
  }

  const amountPattern = /^\d+(\.\d{1,2})?$/;
  const maxAmount = "9999999999999999.99";

  if (
    typeof body.amount !== "string" ||
    !amountPattern.test(body.amount) ||
    !/[1-9]/.test(body.amount)
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Amount must be a positive monetary string with at most 2 decimal places.",
      },
    });
  }

  const [wholePart, fractionPart = ""] = body.amount.split(".");
  const normalizedWholePart = wholePart.replace(/^0+/, "") || "0";
  const [maxWholePart, maxFractionPart] = maxAmount.split(".");

  const exceedsMaximum =
    normalizedWholePart.length > maxWholePart.length ||
    (normalizedWholePart.length === maxWholePart.length &&
      normalizedWholePart > maxWholePart) ||
    (normalizedWholePart === maxWholePart &&
      fractionPart.padEnd(2, "0") > maxFractionPart);

  if (exceedsMaximum) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Amount exceeds the maximum supported value.",
      },
    });
  }

  if (
    typeof body.reference_id !== "string" ||
    body.reference_id.trim().length === 0 ||
    body.reference_id.trim().length > 100
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Reference ID is required and must not exceed 100 characters.",
      },
    });
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Description must be a string or null.",
      },
    });
  }

  body.from_account_id = body.from_account_id.toLowerCase();
  body.to_account_id = body.to_account_id.toLowerCase();
  body.reference_id = body.reference_id.trim();

  if (typeof body.description === "string") {
    body.description = body.description.trim() || null;
  }

  next();
}