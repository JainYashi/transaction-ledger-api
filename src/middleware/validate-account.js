export function validateCreateAccount(req, res, next) {
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

  const allowedFields = ["name"];
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

  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Name is required and must not be blank.",
      },
    });
  }

  if (body.name.trim().length > 100) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Name must not exceed 100 characters.",
      },
    });
  }

  req.body.name = body.name.trim();

  next();
}