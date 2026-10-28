export function validateCreateTransaction(req, res, next) {
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
    "type",
    "amount",
    "description",
    "reference_id",
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

  if (!["credit", "debit"].includes(body.type)) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Type must be either credit or debit.",
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

const [wholePart] = body.amount.split(".");
const normalizedWholePart = wholePart.replace(/^0+/, "") || "0";
const [maxWholePart] = maxAmount.split(".");

const exceedsMaximum =
  normalizedWholePart.length > maxWholePart.length ||
  (normalizedWholePart.length === maxWholePart.length &&
    normalizedWholePart > maxWholePart) ||
  (normalizedWholePart === maxWholePart &&
    body.amount.includes(".") &&
    body.amount.split(".")[1] > "99");

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

  if (typeof body.description === "string") {
    body.description = body.description.trim();

    if (body.description.length === 0) {
      body.description = null;
    }
  }

  body.reference_id = body.reference_id.trim();

  next();
}