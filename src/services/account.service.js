import { pool } from "../config/db.js";

export async function createAccount(name) {
  const query = `
    INSERT INTO accounts (name)
    VALUES ($1)
    RETURNING id, name, balance, created_at
  `;

  const result = await pool.query(query, [name]);

  return result.rows[0];
}

export async function getAccountBalance(accountId) {
  const query = `
    SELECT id, balance
    FROM accounts
    WHERE id = $1
  `;

  const result = await pool.query(query, [accountId]);

  return result.rows[0] ?? null;
}