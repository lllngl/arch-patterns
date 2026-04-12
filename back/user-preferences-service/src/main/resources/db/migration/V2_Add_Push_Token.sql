ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS push_token VARCHAR(512);

CREATE INDEX IF NOT EXISTS idx_user_preferences_push_token
    ON user_preferences(push_token)
    WHERE push_token IS NOT NULL;
