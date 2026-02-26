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

CREATE TABLE IF NOT EXISTS loan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(19,2) NOT NULL CHECK (amount >= 0),
    term_months INTEGER NOT NULL CHECK (term_months >= 1),
    tariff_id UUID NOT NULL,
    status VARCHAR(25) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_loan_tariff FOREIGN KEY (tariff_id)
        REFERENCES tariff(id) ON DELETE RESTRICT
);

COMMENT ON TABLE loan IS 'Кредиты';
COMMENT ON COLUMN loan.amount IS 'Сумма кредита';
COMMENT ON COLUMN loan.term_months IS 'Срок кредита в месяцах';
COMMENT ON COLUMN loan.tariff_id IS 'ID тарифа';
COMMENT ON COLUMN loan.status IS 'Статус кредита';

CREATE INDEX idx_loan_tariff_id ON loan(tariff_id);
CREATE INDEX idx_loan_status ON loan(status);

CREATE TABLE IF NOT EXISTS account_loan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    loan_id UUID NOT NULL,
    status VARCHAR(25) NOT NULL,
    payment_type VARCHAR(25) NOT NULL,
    monthly_payment DECIMAL(19,2) NOT NULL CHECK (monthly_payment >= 0),
    remaining_amount DECIMAL(19,2) NOT NULL CHECK (remaining_amount >= 0),
    next_payment_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    created_at DATE NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_account_loan_loan FOREIGN KEY (loan_id)
        REFERENCES loan(id) ON DELETE RESTRICT,

    CONSTRAINT uk_account_loan UNIQUE (account_id, loan_id)
);

COMMENT ON TABLE account_loan IS 'Связь счетов с кредитами';
COMMENT ON COLUMN account_loan.account_id IS 'ID счета';
COMMENT ON COLUMN account_loan.loan_id IS 'ID кредита';
COMMENT ON COLUMN account_loan.status IS 'Статус кредита для счета';
COMMENT ON COLUMN account_loan.payment_type IS 'Тип платежа';
COMMENT ON COLUMN account_loan.monthly_payment IS 'Ежемесячный платеж';
COMMENT ON COLUMN account_loan.remaining_amount IS 'Оставшаяся сумма';
COMMENT ON COLUMN account_loan.next_payment_date IS 'Дата следующего платежа';
COMMENT ON COLUMN account_loan.payment_date IS 'Дата платежа';

CREATE INDEX idx_account_loan_account_id ON account_loan(account_id);
CREATE INDEX idx_account_loan_loan_id ON account_loan(loan_id);
CREATE INDEX idx_account_loan_status ON account_loan(status);
CREATE INDEX idx_account_loan_payment_type ON account_loan(payment_type);
CREATE INDEX idx_account_loan_next_payment_date ON account_loan(next_payment_date);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tariff_updated_at
    BEFORE UPDATE ON tariff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_updated_at
    BEFORE UPDATE ON loan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_loan_updated_at
    BEFORE UPDATE ON account_loan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();