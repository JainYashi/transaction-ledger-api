import { pool } from "../config/db.js";

export async function transferMoney(transferData) {
  const {
    from_account_id: fromAccountId,
    to_account_id: toAccountId,
    amount,
    reference_id: referenceId,
    description,
  } = transferData;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock both accounts in a consistent order to reduce deadlocks.
    const accountIds = [fromAccountId, toAccountId].sort();

    const accountsResult = await client.query(
      `SELECT id, balance
       FROM accounts
       WHERE id = ANY($1::uuid[])
       ORDER BY id
       FOR UPDATE`,
      [accountIds]
    );

    if (accountsResult.rows.length !== 2) {
      const error = new Error("One or both accounts were not found.");
      error.code = "ACCOUNT_NOT_FOUND";
      throw error;
    }

    const sourceAccount = accountsResult.rows.find(
      (account) => account.id === fromAccountId
    );

    const destinationAccount = accountsResult.rows.find(
      (account) => account.id === toAccountId
    );

    // Reject a reference already used by either account.
    const duplicateResult = await client.query(
      `SELECT id
       FROM transactions
       WHERE account_id = ANY($1::uuid[])
         AND reference_id = $2
       LIMIT 1`,
      [accountIds, referenceId]
    );

    if (duplicateResult.rows.length > 0) {
      const error = new Error(
        "Reference ID already exists for one of the accounts."
      );
      error.code = "DUPLICATE_REFERENCE_ID";
      throw error;
    }

    // Check the source balance using PostgreSQL numeric arithmetic.
    const sourceCheck = await client.query(
      `SELECT balance >= $2::numeric AS has_sufficient_balance
       FROM accounts
       WHERE id = $1`,
      [fromAccountId, amount]
    );

    if (!sourceCheck.rows[0].has_sufficient_balance) {
      const error = new Error("Insufficient balance.");
      error.code = "INSUFFICIENT_BALANCE";
      throw error;
    }

    // Check whether the destination can receive the amount.
    const destinationCheck = await client.query(
      `SELECT
         balance,
         balance + $2::numeric <= 9999999999999999.99
           AS balance_within_limit
       FROM accounts
       WHERE id = $1`,
      [toAccountId, amount]
    );

    if (!destinationCheck.rows[0].balance_within_limit) {
      const error = new Error(
        "Destination balance would exceed the maximum."
      );
      error.code = "BALANCE_LIMIT_EXCEEDED";
      throw error;
    }

    // Calculate both resulting balances inside PostgreSQL.
    const balancesResult = await client.query(
      `SELECT
         (SELECT balance - $3::numeric
          FROM accounts WHERE id = $1) AS source_balance,
         (SELECT balance + $3::numeric
          FROM accounts WHERE id = $2) AS destination_balance`,
      [fromAccountId, toAccountId, amount]
    );

    const {
      source_balance: sourceBalance,
      destination_balance: destinationBalance,
    } = balancesResult.rows[0];

    // Create the debit ledger entry.
    const debitResult = await client.query(
      `INSERT INTO transactions
         (account_id, type, amount, description, reference_id)
       VALUES ($1, 'debit', $2, $3, $4)
       RETURNING id, account_id, type, amount,
                 description, reference_id, created_at`,
      [fromAccountId, amount, description ?? null, referenceId]
    );

    // Create the matching credit ledger entry.
    const creditResult = await client.query(
      `INSERT INTO transactions
         (account_id, type, amount, description, reference_id)
       VALUES ($1, 'credit', $2, $3, $4)
       RETURNING id, account_id, type, amount,
                 description, reference_id, created_at`,
      [toAccountId, amount, description ?? null, referenceId]
    );

    // Update both balances in one SQL statement.
    await client.query(
      `UPDATE accounts
       SET balance = CASE
         WHEN id = $1::uuid THEN $2::numeric
         WHEN id = $3::uuid THEN $4::numeric
       END
       WHERE id = ANY($5::uuid[])`,
      [
        fromAccountId,
        sourceBalance,
        toAccountId,
        destinationBalance,
        accountIds,
      ]
    );

    await client.query("COMMIT");

    return {
      debit: debitResult.rows[0],
      credit: creditResult.rows[0],
      balances: {
        source: sourceBalance,
        destination: destinationBalance,
      },
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Transaction rollback failed:",
        rollbackError.message
      );
    }

    throw error;
  } finally {
    client.release();
  }
}