
-- Enable gen_random_uuid() if required by your PostgreSQL installation.
-- PostgreSQL 18 provides this function natively.

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT accounts_name_not_blank
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT accounts_balance_non_negative
        CHECK (balance >= 0),

    CONSTRAINT accounts_balance_maximum
        CHECK (balance <= 9999999999999999.99)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    type VARCHAR(10) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    description TEXT,
    reference_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT transactions_type_valid
        CHECK (type IN ('credit', 'debit')),

    CONSTRAINT transactions_amount_positive
        CHECK (amount > 0),

    CONSTRAINT transactions_reference_not_blank
        CHECK (LENGTH(TRIM(reference_id)) > 0),

    CONSTRAINT transactions_account_reference_unique
        UNIQUE (account_id, reference_id)
);

CREATE INDEX idx_transactions_account_created
ON transactions (account_id, created_at DESC, id DESC);
