-- Создание таблицы user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    theme VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_device UNIQUE (user_id, device_id)
);

-- Создание индексов для user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_device_id ON user_preferences(device_id);

-- Создание таблицы hidden_accounts
CREATE TABLE IF NOT EXISTS hidden_accounts (
    preferences_id UUID NOT NULL,
    account_id UUID NOT NULL,
    CONSTRAINT pk_hidden_accounts PRIMARY KEY (preferences_id, account_id),
    CONSTRAINT fk_hidden_accounts_preferences FOREIGN KEY (preferences_id)
        REFERENCES user_preferences(id) ON DELETE CASCADE
);

-- Создание индекса для hidden_accounts
CREATE INDEX IF NOT EXISTS idx_hidden_accounts_account_id ON hidden_accounts(account_id);

-- Создание триггера для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();