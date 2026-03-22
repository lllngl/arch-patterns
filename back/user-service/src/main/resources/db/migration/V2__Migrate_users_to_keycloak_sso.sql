ALTER TABLE users
    ADD COLUMN IF NOT EXISTS keycloak_user_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_keycloak_user_id ON users (keycloak_user_id);

CREATE TABLE IF NOT EXISTS users_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_users_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_users_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

INSERT INTO users_roles (user_id, role_id)
SELECT id, role_id
FROM users
WHERE role_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS fk_users_role;

DROP INDEX IF EXISTS idx_users_role_id;

ALTER TABLE users
    DROP COLUMN IF EXISTS role_id;

ALTER TABLE users
    ALTER COLUMN password DROP NOT NULL;
