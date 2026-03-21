ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
    ADD COLUMN IF NOT EXISTS type VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER';

CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_master_unique ON accounts(type) WHERE type = 'MASTER';

INSERT INTO accounts (
    id,
    user_id,
    name,
    balance,
    currency,
    status,
    type,
    created_by,
    modified_by
)
SELECT
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Bank master account',
    0,
    'RUB',
    'OPEN',
    'MASTER',
    'system',
    'system'
WHERE NOT EXISTS (
    SELECT 1
    FROM accounts
    WHERE type = 'MASTER'
);

ALTER TABLE account_transactions
    ADD COLUMN IF NOT EXISTS operation_amount NUMERIC(19, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS operation_currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
    ADD COLUMN IF NOT EXISTS account_currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
    ADD COLUMN IF NOT EXISTS bank_currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
    ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(19, 8),
    ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(19, 2),
    ADD COLUMN IF NOT EXISTS commission_currency VARCHAR(3),
    ADD COLUMN IF NOT EXISTS related_account_id UUID,
    ADD COLUMN IF NOT EXISTS transfer_id UUID;

UPDATE account_transactions account_tx
SET account_currency = accounts.currency,
    operation_amount = account_tx.amount,
    commission_amount = 0,
    commission_currency = accounts.currency
FROM accounts
WHERE account_tx.account_id = accounts.id;

CREATE INDEX IF NOT EXISTS idx_account_transactions_transfer_id ON account_transactions(transfer_id);
