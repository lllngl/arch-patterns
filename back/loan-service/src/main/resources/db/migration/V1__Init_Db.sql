-- Тарифы кредитов
CREATE TABLE IF NOT EXISTS tariff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    rate DECIMAL(3,2) NOT NULL CHECK (rate >= 0 AND rate <= 1.00),
    min_amount DECIMAL(19,2) NOT NULL CHECK (min_amount >= 0.01),
    max_amount DECIMAL(19,2) NOT NULL CHECK (max_amount >= 0.01),
    min_term_months INTEGER NOT NULL CHECK (min_term_months >= 1),
    max_term_months INTEGER NOT NULL CHECK (max_term_months >= 1),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tariff IS 'Тарифы кредитов';
COMMENT ON COLUMN tariff.name IS 'Название тарифа';
COMMENT ON COLUMN tariff.rate IS 'Процентная ставка (от 0 до 1.00)';
COMMENT ON COLUMN tariff.min_amount IS 'Минимальная сумма кредита';
COMMENT ON COLUMN tariff.max_amount IS 'Максимальная сумма кредита';
COMMENT ON COLUMN tariff.min_term_months IS 'Минимальный срок кредита в месяцах';
COMMENT ON COLUMN tariff.max_term_months IS 'Максимальный срок кредита в месяцах';
COMMENT ON COLUMN tariff.is_active IS 'Активен ли тариф';

CREATE INDEX idx_tariff_is_active ON tariff(is_active);
CREATE INDEX idx_tariff_name ON tariff(name);

-- Кредиты
CREATE TABLE IF NOT EXISTS loan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    status VARCHAR(25) NOT NULL,
    payment_type VARCHAR(25) NOT NULL,
    term_months INTEGER NOT NULL CHECK (term_months >= 1),
    tariff_id UUID NOT NULL,
    amount DECIMAL(19,2) NOT NULL CHECK (amount >= 0),
    monthly_payment DECIMAL(19,2) NOT NULL CHECK (monthly_payment >= 0),
    remaining_amount DECIMAL(19,2) NOT NULL CHECK (remaining_amount >= 0),
    next_payment_date DATE,
    payment_date DATE NOT NULL,
    created_at DATE NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_loan_tariff FOREIGN KEY (tariff_id)
        REFERENCES tariff(id) ON DELETE RESTRICT
);

COMMENT ON TABLE loan IS 'Кредиты';
COMMENT ON COLUMN loan.user_id IS 'ID пользователя';
COMMENT ON COLUMN loan.account_id IS 'ID счета';
COMMENT ON COLUMN loan.status IS 'Статус кредита';
COMMENT ON COLUMN loan.payment_type IS 'Тип платежа';
COMMENT ON COLUMN loan.term_months IS 'Срок кредита в месяцах';
COMMENT ON COLUMN loan.tariff_id IS 'ID тарифа';
COMMENT ON COLUMN loan.amount IS 'Сумма кредита';
COMMENT ON COLUMN loan.monthly_payment IS 'Ежемесячный платеж';
COMMENT ON COLUMN loan.remaining_amount IS 'Оставшаяся сумма';
COMMENT ON COLUMN loan.next_payment_date IS 'Дата следующего платежа';
COMMENT ON COLUMN loan.payment_date IS 'Дата платежа';
COMMENT ON COLUMN loan.created_at IS 'Дата создания';

CREATE INDEX idx_loan_user_id ON loan(user_id);
CREATE INDEX idx_loan_account_id ON loan(account_id);
CREATE INDEX idx_loan_tariff_id ON loan(tariff_id);
CREATE INDEX idx_loan_status ON loan(status);
CREATE INDEX idx_loan_payment_type ON loan(payment_type);
CREATE INDEX idx_loan_next_payment_date ON loan(next_payment_date);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для updated_at
CREATE TRIGGER update_tariff_updated_at
    BEFORE UPDATE ON tariff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_updated_at
    BEFORE UPDATE ON loan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Вставка тестовых тарифов
INSERT INTO tariff (name, rate, min_amount, max_amount, min_term_months, max_term_months, is_active) VALUES
-- Базовые тарифы
('Стандартный', 0.15, 10000.00, 1000000.00, 6, 60, true),
('Пенсионный', 0.12, 5000.00, 500000.00, 3, 36, true),
('Зарплатный', 0.13, 15000.00, 1500000.00, 12, 84, true),

-- Специальные предложения
('Для бизнеса', 0.18, 100000.00, 5000000.00, 12, 120, true),
('Молодежный', 0.10, 3000.00, 300000.00, 3, 24, true),
('Ипотечный', 0.09, 300000.00, 10000000.00, 12, 360, true),
('Автокредит', 0.14, 50000.00, 3000000.00, 6, 84, true),

-- Премиальные тарифы
('VIP-клиент', 0.08, 1000000.00, 50000000.00, 1, 60, true),
('Инвестиционный', 0.20, 50000.00, 2000000.00, 3, 36, false), -- Закончился

-- Краткосрочные
('Экспресс', 0.22, 1000.00, 100000.00, 1, 12, true),
('Микрозайм', 0.25, 500.00, 50000.00, 1, 6, true),

-- Образовательные
('Образовательный', 0.05, 10000.00, 2000000.00, 12, 120, true),
('Студенческий', 0.07, 5000.00, 500000.00, 6, 60, true),

-- Сезонные предложения
('Летний', 0.11, 10000.00, 300000.00, 3, 18, false), -- Закончился
('Новогодний', 0.10, 15000.00, 200000.00, 3, 12, false); -- Закончился