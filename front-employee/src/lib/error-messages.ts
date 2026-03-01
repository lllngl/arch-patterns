const EXACT: Record<string, string> = {
  "Access is denied": "Доступ запрещён",
  "Validation failed": "Ошибка валидации",
  "Unexpected error occurred": "Произошла непредвиденная ошибка",

  "Account does not belong to user": "Счёт не принадлежит пользователю",
  "Tariff is not active": "Тариф неактивен",
  "Insufficient funds on account": "Недостаточно средств на счёте",
  "Failed to debit amount from account": "Не удалось списать средства со счёта",
  "User can only access their own loans":
    "Пользователь может просматривать только свои кредиты",
  "Min amount cannot be greater than max amount":
    "Минимальная сумма не может превышать максимальную",
  "Min term cannot be greater than max term":
    "Минимальный срок не может превышать максимальный",

  "Cannot create an account for employee.":
    "Невозможно создать счёт для сотрудника",
  "Account is already closed.": "Счёт уже закрыт",
  "Account can be closed only when balance is 0.":
    "Счёт можно закрыть только при нулевом балансе",
  "Account is already open.": "Счёт уже открыт",
  "Insufficient funds.": "Недостаточно средств",
  "Account is closed.": "Счёт закрыт",

  "User must be authenticated to change password.":
    "Необходима авторизация для смены пароля",
  "Current password does not match.": "Текущий пароль неверен",
  "New password and confirmation password do not match.":
    "Новый пароль и подтверждение не совпадают",
  "User is not authenticated.": "Пользователь не авторизован",
  "Role is required.": "Роль обязательна",
  "User is blocked.": "Пользователь заблокирован",
  "Invalid login credentials.": "Неверный email или пароль",

  "Invalid refresh token format. Please log in again.":
    "Неверный формат токена. Войдите снова",
  "Invalid or expired refresh token. Please log in again.":
    "Недействительный или истёкший токен. Войдите снова",
  "Refresh token cannot be empty.": "Токен обновления не может быть пустым",
  "Session invalidation failed.": "Не удалось сбросить сессии",
  "User ID cannot be null for session invalidation.":
    "ID пользователя обязателен для сброса сессий",
};

const PATTERNS: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [
    /^Amount is less than minimum: (.+)$/,
    (m) => `Сумма меньше минимальной: ${m[1]}`,
  ],
  [
    /^Amount exceeds maximum: (.+)$/,
    (m) => `Сумма превышает максимальную: ${m[1]}`,
  ],
  [
    /^Term must be between (\d+) and (\d+) months$/,
    (m) => `Срок должен быть от ${m[1]} до ${m[2]} месяцев`,
  ],
  [
    /^Loan is not active\. Current status: (.+)$/,
    (m) => `Кредит не активен. Текущий статус: ${m[1]}`,
  ],
  [
    /^Amount is too small\. Your monthly payment: (.+)$/,
    (m) => `Сумма слишком мала. Ежемесячный платёж: ${m[1]}`,
  ],
  [
    /^Only pending loans can be rejected\. Current status: (.+)$/,
    (m) => `Только ожидающие кредиты можно отклонить. Текущий статус: ${m[1]}`,
  ],
  [
    /^Only pending loans can be approved\. Current status: (.+)$/,
    (m) => `Только ожидающие кредиты можно одобрить. Текущий статус: ${m[1]}`,
  ],
  [/^User not found: (.+)$/, (m) => `Пользователь не найден: ${m[1]}`],
  [/^Account not found: (.+)$/, (m) => `Счёт не найден: ${m[1]}`],
  [
    /^Email '(.+)' is already in use by another user\.$/,
    (m) => `Email «${m[1]}» уже используется другим пользователем`,
  ],
  [
    /^Phone number '(.+)' is already in use by another user\.$/,
    (m) => `Телефон «${m[1]}» уже используется другим пользователем`,
  ],
  [
    /^User with email '(.+)' already exists\.$/,
    (m) => `Пользователь с email «${m[1]}» уже существует`,
  ],
  [
    /^User with phone '(.+)' already exists\.$/,
    (m) => `Пользователь с телефоном «${m[1]}» уже существует`,
  ],
  [
    /^Unsupported payment type: (.+)$/,
    (m) => `Неподдерживаемый тип платежа: ${m[1]}`,
  ],
  // Jakarta Bean Validation defaults
  [/^(\w+): must not be blank$/, (m) => `Поле «${m[1]}» не может быть пустым`],
  [/^(\w+): must not be null$/, (m) => `Поле «${m[1]}» обязательно`],
  [
    /^(\w+): size must be between (\d+) and (\d+)$/,
    (m) => `Поле «${m[1]}»: длина должна быть от ${m[2]} до ${m[3]}`,
  ],
  [
    /^(\w+): must be a well-formed email address$/,
    (m) => `Поле «${m[1]}»: некорректный email`,
  ],
];

export function localizeError(message: string | undefined | null): string {
  if (!message) return "Произошла ошибка";

  const exact = EXACT[message];
  if (exact) return exact;

  for (const [pattern, replacement] of PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return typeof replacement === "function"
        ? replacement(match)
        : replacement;
    }
  }

  return message;
}
