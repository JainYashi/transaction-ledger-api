import { pool } from "../config/db.js";

export async function createTransaction(accountId, transactionData) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the account to prevent concurrent balance changes.
    const accountResult = await client.query(
      `SELECT id, balance
       FROM accounts
       WHERE id = $1
       FOR UPDATE`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      const error = new Error("Account not found.");
      error.code = "ACCOUNT_NOT_FOUND";
      throw error;
    }

    // Check for a duplicate reference within this account.
    const duplicateResult = await client.query(
      `SELECT id
       FROM transactions
       WHERE account_id = $1 AND reference_id = $2`,
      [accountId, transactionData.reference_id]
    );

    if (duplicateResult.rows.length > 0) {
      const error = new Error("Reference ID already exists for this account.");
      error.code = "DUPLICATE_REFERENCE_ID";
      throw error;
    }

    const account = accountResult.rows[0];

    const balanceResult = await client.query(
  `SELECT
     balance,
     CASE
       WHEN $2 = 'credit' THEN balance + $3::numeric
       ELSE balance - $3::numeric
     END AS new_balance,
     CASE
       WHEN $2 = 'debit' AND balance < $3::numeric
       THEN TRUE
       ELSE FALSE
     END AS insufficient_balance
   FROM accounts
   WHERE id = $1`,
  [accountId, transactionData.type, transactionData.amount]
);

const { new_balance: newBalance, insufficient_balance: insufficientBalance } =
  balanceResult.rows[0];

if (insufficientBalance) {
  const error = new Error("Insufficient balance.");
  error.code = "INSUFFICIENT_BALANCE";
  throw error;
}
    const transactionResult = await client.query(
      `INSERT INTO transactions
         (account_id, type, amount, description, reference_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, account_id, type, amount, description, reference_id, created_at`,
      [
        accountId,
        transactionData.type,
        transactionData.amount,
        transactionData.description ?? null,
        transactionData.reference_id,
      ]
    );

    const updatedAccountResult = await client.query(
      `UPDATE accounts
       SET balance = $2
       WHERE id = $1
       RETURNING balance`,
      [accountId, newBalance]
    );

    await client.query("COMMIT");

    return {
      transaction: transactionResult.rows[0],
      balance: updatedAccountResult.rows[0].balance,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getTransactionHistory(accountId, options) {
    const accountResult = await pool.query(
    `SELECT id FROM accounts WHERE id = $1`,
    [accountId]
  );

  if (accountResult.rows.length === 0) {
    const error = new Error("Account not found.");
    error.code = "ACCOUNT_NOT_FOUND";
    throw error;
  }
  const { type, page, limit } = options;
  const offset = (page - 1) * limit;

  const values = [accountId];
  let filter = "WHERE account_id = $1";

  if (type) {
    values.push(type);
    filter += ` AND type = $${values.length}`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total
     FROM transactions
     ${filter}`,
    values
  );

  const total = Number(countResult.rows[0].total);

  const historyValues = [...values, limit, offset];

  const historyResult = await pool.query(
    `SELECT id, account_id, type, amount,
            description, reference_id, created_at
     FROM transactions
     ${filter}
     ORDER BY created_at DESC, id DESC
     LIMIT $${historyValues.length - 1}
     OFFSET $${historyValues.length}`,
    historyValues
  );

  return {
    data: historyResult.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}