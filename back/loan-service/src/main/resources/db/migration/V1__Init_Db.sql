-- Тарифы кредитов
CREATE TABLE IF NOT EXISTS tariff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    rate DECIMAL(3,2) NOT NULL CHECK (rate >= 0 AND rate <= 1.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
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
COMMENT ON COLUMN tariff.currency IS 'Валюта кредита (RUB, USD, EUR и т.д.)';
COMMENT ON COLUMN tariff.min_amount IS 'Минимальная сумма кредита';
COMMENT ON COLUMN tariff.max_amount IS 'Максимальная сумма кредита';
COMMENT ON COLUMN tariff.min_term_months IS 'Минимальный срок кредита в месяцах';
COMMENT ON COLUMN tariff.max_term_months IS 'Максимальный срок кредита в месяцах';
COMMENT ON COLUMN tariff.is_active IS 'Активен ли тариф';

CREATE INDEX idx_tariff_is_active ON tariff(is_active);
CREATE INDEX idx_tariff_name ON tariff(name);
CREATE INDEX idx_tariff_currency ON tariff(currency);

-- Кредиты
CREATE TABLE IF NOT EXISTS loan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    status VARCHAR(25) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
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
COMMENT ON COLUMN loan.currency_code IS 'Валюта кредита';
COMMENT ON COLUMN loan.payment_type IS 'Тип платежа (аннуитетный/дифференцированный)';
COMMENT ON COLUMN loan.term_months IS 'Срок кредита в месяцах';
COMMENT ON COLUMN loan.tariff_id IS 'ID тарифа';
COMMENT ON COLUMN loan.amount IS 'Сумма кредита';
COMMENT ON COLUMN loan.monthly_payment IS 'Ежемесячный платеж';
COMMENT ON COLUMN loan.remaining_amount IS 'Оставшаяся сумма задолженности';
COMMENT ON COLUMN loan.next_payment_date IS 'Дата следующего платежа';
COMMENT ON COLUMN loan.payment_date IS 'Дата платежа по графику';
COMMENT ON COLUMN loan.created_at IS 'Дата создания кредита';

CREATE INDEX idx_loan_user_id ON loan(user_id);
CREATE INDEX idx_loan_account_id ON loan(account_id);
CREATE INDEX idx_loan_tariff_id ON loan(tariff_id);
CREATE INDEX idx_loan_status ON loan(status);
CREATE INDEX idx_loan_currency_code ON loan(currency_code);
CREATE INDEX idx_loan_payment_type ON loan(payment_type);
CREATE INDEX idx_loan_next_payment_date ON loan(next_payment_date);

-- История платежей
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL,
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    payment_amount DECIMAL(19,2) NOT NULL CHECK (payment_amount >= 0),
    payment_currency VARCHAR(3) NOT NULL,
    loan_currency VARCHAR(3) NOT NULL,
    exchange_rate_at_payment DECIMAL(19,6),
    expected_payment_date DATE NOT NULL,
    actual_payment_date DATE,
    status VARCHAR(25) NOT NULL,
    penalty_amount DECIMAL(19,2) DEFAULT 0 CHECK (penalty_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_history_loan FOREIGN KEY (loan_id)
        REFERENCES loan(id) ON DELETE CASCADE
);

COMMENT ON TABLE payment_history IS 'История платежей по кредитам';
COMMENT ON COLUMN payment_history.loan_id IS 'ID кредита';
COMMENT ON COLUMN payment_history.user_id IS 'ID пользователя';
COMMENT ON COLUMN payment_history.account_id IS 'ID счета списания';
COMMENT ON COLUMN payment_history.payment_amount IS 'Сумма платежа';
COMMENT ON COLUMN payment_history.payment_currency IS 'Валюта платежа';
COMMENT ON COLUMN payment_history.loan_currency IS 'Валюта кредита';
COMMENT ON COLUMN payment_history.exchange_rate_at_payment IS 'Курс обмена на момент платежа';
COMMENT ON COLUMN payment_history.expected_payment_date IS 'Ожидаемая дата платежа';
COMMENT ON COLUMN payment_history.actual_payment_date IS 'Фактическая дата платежа';
COMMENT ON COLUMN payment_history.status IS 'Статус платежа (успешен/просрочен/отменен)';
COMMENT ON COLUMN payment_history.penalty_amount IS 'Сумма штрафа за просрочку';

CREATE INDEX idx_payment_history_loan_id ON payment_history(loan_id);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_account_id ON payment_history(account_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_expected_payment_date ON payment_history(expected_payment_date);
CREATE INDEX idx_payment_history_actual_payment_date ON payment_history(actual_payment_date);

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

-- Вставка тестовых тарифов (с учетом валюты)
INSERT INTO tariff (name, rate, currency, min_amount, max_amount, min_term_months, max_term_months, is_active) VALUES
-- Базовые тарифы
('Стандартный', 0.15, 'RUB', 10000.00, 1000000.00, 6, 60, true),
('Пенсионный', 0.12, 'RUB', 5000.00, 500000.00, 3, 36, true),
('Зарплатный', 0.13, 'RUB', 15000.00, 1500000.00, 12, 84, true),

-- Специальные предложения
('Для бизнеса', 0.18, 'RUB', 100000.00, 5000000.00, 12, 120, true),
('Молодежный', 0.10, 'RUB', 3000.00, 300000.00, 3, 24, true),
('Ипотечный', 0.09, 'RUB', 300000.00, 10000000.00, 12, 360, true),
('Автокредит', 0.14, 'RUB', 50000.00, 3000000.00, 6, 84, true),

-- Премиальные тарифы
('VIP-клиент', 0.08, 'RUB', 1000000.00, 50000000.00, 1, 60, true),
('Инвестиционный', 0.20, 'USD', 50000.00, 2000000.00, 3, 36, false), -- Закончился, в USD

-- Краткосрочные
('Экспресс', 0.22, 'RUB', 1000.00, 100000.00, 1, 12, true),
('Микрозайм', 0.25, 'RUB', 500.00, 50000.00, 1, 6, true),

-- Образовательные
('Образовательный', 0.05, 'RUB', 10000.00, 2000000.00, 12, 120, true),
('Студенческий', 0.07, 'RUB', 5000.00, 500000.00, 6, 60, true),

-- Валютные тарифы
('Валютный (USD)', 0.08, 'USD', 5000.00, 100000.00, 6, 60, true),
('Валютный (EUR)', 0.09, 'EUR', 5000.00, 80000.00, 6, 60, true),

-- Сезонные предложения
('Летний', 0.11, 'RUB', 10000.00, 300000.00, 3, 18, false), -- Закончился
('Новогодний', 0.10, 'RUB', 15000.00, 200000.00, 3, 12, false); -- Закончился