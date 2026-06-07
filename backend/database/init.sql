-- Члены семьи
CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user', 'pending')),
    relation VARCHAR(50)
);

-- Типы счетов
CREATE TABLE IF NOT EXISTS accounts_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT 
);

-- Категории расходов
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Категории доходов
CREATE TABLE IF NOT EXISTS income_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Доходы
CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    income_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type_id INTEGER REFERENCES income_types(id)
);

-- Расходы
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- 0 = FALSE, 1 = TRUE
    is_planned INTEGER NOT NULL DEFAULT 0
);

-- Переводы между счетами
CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    from_account_id INTEGER NOT NULL REFERENCES accounts_types(id),
    to_account_id INTEGER NOT NULL REFERENCES accounts_types(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CHECK (from_account_id <> to_account_id)
);

-- Журнал действий
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_login VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES family_members(id) ON DELETE CASCADE
);

-- Справочник счетов
INSERT OR IGNORE INTO accounts_types (account_name, description)
VALUES
('Общий', 'Общий семейный счет'),
('Накопления', 'Счет для крупных покупок'),
('Заначка', 'Личные средства пользователя'),
('Доход', 'Технический счет для подсчета доходов'),
('Расход', 'Технический счет для подсчета расходов');

-- Категории расходов
INSERT OR IGNORE INTO categories (name)
VALUES
('Еда'),
('Коммунальные услуги'),
('Транспорт'),
('Одежда'),
('Развлечения'),
('Здоровье'),
('Прочее'),
('Заначка');

-- Категории доходов
INSERT OR IGNORE INTO income_types (name) 
VALUES
('Зарплата'), 
('Пенсия'), 
('Стипендия'), 
('Дополнительный заработок');

-- Добавляем тестового администратора (пароль: admin123)
-- Хеш сгенерирован через bcrypt для пароля "admin123"
INSERT OR IGNORE INTO family_members (login, password_hash, full_name, role, relation)
VALUES (
    'admin',
    '$2b$10$GYH3mZg4dvCSxrKtXDtflOyAQ9f/E3GgOEax0SRuq26lCownEwxVC',
    'Администратор',
    'admin',
    NULL
);