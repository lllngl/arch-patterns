CREATE TABLE  IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rolename VARCHAR(20) UNIQUE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(255),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_rolename ON roles (rolename);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(85) NOT NULL,
    last_name VARCHAR(85) NOT NULL,
    patronymic VARCHAR(85),
    email VARCHAR(30) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone BIGINT UNIQUE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    birth_date DATE NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    role_id UUID NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(255),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users (first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users (last_name);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id);


CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(512) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    token_id UUID UNIQUE NOT NULL,
    expiration_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(255),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_id ON refresh_tokens (token_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiration_date_time ON refresh_tokens (expiration_date_time);


INSERT INTO roles (rolename, created_by, modified_by) VALUES ('CLIENT', 'system', 'system'), ('EMPLOYEE', 'system', 'system');

-- password: string1
INSERT INTO users (first_name, last_name, patronymic, gender, birth_date, phone, email, password, is_blocked, role_id, created_by, modified_by)
VALUES
('Employee', 'User', NULL, 'MALE', '1985-01-15', 79151234567, 'employee@example.com', '$2a$10$FSoEv/JKtWV1pJnl8pxBaeW1.k70Y.KRXIYiaGTA6HFU4Fy.yiLC6', FALSE, (SELECT id FROM roles WHERE rolename = 'EMPLOYEE'), 'system', 'system'),
('Client', 'User', NULL, 'FEMALE', '1990-05-20', 79157654321, 'client@example.com', '$2a$10$FSoEv/JKtWV1pJnl8pxBaeW1.k70Y.KRXIYiaGTA6HFU4Fy.yiLC6', FALSE, (SELECT id FROM roles WHERE rolename = 'CLIENT'), 'system', 'system');
