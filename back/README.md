# Internet Bank Backend

## Что в репозитории

- `common-module` — общие DTO, security, утилиты. Подробности в `common-module/README.md`.
- `user-service` — пользователи, аутентификация, роли.
- `account-service` — счета и операции по счетам.
- `loan-service` — кредиты и взаимодействия с ними.
- `user-preferences-service` — настройки пользовательской системы.
- `monitoring-service` — сбор telemetry по HTTP-запросам, ошибок и времени ответа.

## Требования

- Java
- Gradle (локально не обязателен — в проекте есть Gradle Wrapper: `.\gradlew.bat` / `./gradlew`)
- Docker + Docker Compose


## 1) Поднять инфраструктуру в Docker

### Kafka + Zookeeper + Kafka UI (корневой compose)

В корне проекта:

```bash
docker compose up -d
```

Поднимаются:

- Zookeeper (`2181`)
- Kafka (`9092`, `9093`)
- Kafka UI (`8080`)

Kafka UI: `http://localhost:8080`

Kafka bootstrap для приложений:

- `localhost:9092`

### Keycloak для SSO

Из каталога `back`:

```bash
docker compose up -d keycloak
```

Порт Keycloak:

- `8081`

После запуска:

- Admin Console: `http://localhost:8081`
- realm: `internetbank`

Подробная инструкция по clients, service account roles, синхронизации пользователей и проверке ролей:

- `keycloak/README.md`

### PostgreSQL для каждого сервиса (compose внутри микросервисов)

`user-service`:

```bash
docker compose -f user-service/docker-compose.yml up -d
```

`account-service`:

```bash
docker compose -f account-service/docker-compose.yml up -d
```

`loan-service`:

```bash
docker compose -f loan-service/docker-compose.yml up -d
```

`user-preferences-service`:

```bash
docker compose -f user-preferences-service/docker-compose.yml up -d
```

`monitoring-service`:

```bash
docker compose -f monitoring-service/docker-compose.yml up -d
```

Порты БД из compose:

- `user-service` DB: `localhost:5430` (db: `user`)
- `account-service` DB: `localhost:5435` (db: `account`)
- `loan-service` DB: `localhost:5437` (db: `loan`)
- `user-preferences-service` DB: `localhost:5438` (db: `user_preferences`)
- `monitoring-service` DB: `localhost:5439` (db: `monitoring`)

## 2) Порты БД в конфигурации

`application.yml` уже настроены под compose микросервисов:

- `jdbc:postgresql://localhost:5430/user`
- `jdbc:postgresql://localhost:5435/account`
- `jdbc:postgresql://localhost:5437/loan`
- `jdbc:postgresql://localhost:5438/user_preferences`
- `jdbc:postgresql://localhost:5439/monitoring`

## 3) Запустить сервисы

Перед запуском `user-service` убедитесь, что Keycloak уже поднят и у клиента `user-service-admin` настроены service account permissions из `keycloak/README.md`.

Перед запуском `account-service` убедитесь, что Kafka уже поднята, иначе асинхронные операции по счетам не будут приниматься.

`account-service` для мультивалютных операций использует внешний exchange-rate provider. По умолчанию это `https://open.er-api.com/v6/latest`, при необходимости можно переопределить через `EXCHANGE_RATE_BASE_URL`.

Из корня проекта, в отдельных терминалах (используйте `.\gradlew.bat` на Windows, `./gradlew` на Linux/macOS):

```bash
.\gradlew.bat :user-service:bootRun
```

```bash
.\gradlew.bat :account-service:bootRun
```

```bash
.\gradlew.bat :loan-service:bootRun
```

```bash
.\gradlew.bat :user-preferences-service:bootRun
```

```bash
.\gradlew.bat :monitoring-service:bootRun
```

Если установлен Gradle глобально, можно использовать `gradle` вместо `.\gradlew.bat`.

`common-module` отдельно не запускается (это библиотечный модуль).

## 4) Swagger

- User Service: `http://localhost:9000/swagger-ui/index.html`
- Account Service: `http://localhost:9005/swagger-ui/index.html`
- Loan Service: `http://localhost:9001/swagger-ui/index.html`
- User Preferences Service: `http://localhost:9010/swagger-ui/index.html`
- Monitoring Service: `http://localhost:9015/swagger-ui/index.html`

OpenAPI JSON:

- `http://localhost:9000/v3/api-docs`
- `http://localhost:9005/v3/api-docs`
- `http://localhost:9001/v3/api-docs`
- `http://localhost:9010/v3/api-docs`
- `http://localhost:9015/v3/api-docs`

## 5) Асинхронные операции по счетам

Публичные `deposit`, `withdraw`, `transfer` в `account-service` теперь работают по схеме `Kafka-first`.

Что это значит:

- HTTP-запрос сначала публикует команду в Kafka topic `account-operation-commands`
- API отвечает `202 Accepted`, если команда успешно записана в Kafka
- фактическое изменение баланса и запись в `account_transactions` выполняются асинхронно Kafka consumer-ом
- история операций и баланс становятся консистентными после обработки consumer-ом

Для внутренних межсервисных `internal/deposit` и `internal/withdraw` используется тот же минимальный async pipeline: команда записывается в Kafka, а endpoint также возвращает `202 Accepted`.

Формат ответа:

```json
{
  "operationRequestId": "uuid",
  "status": "ACCEPTED",
  "message": "Account operation accepted for asynchronous processing.",
  "submittedAt": "2026-03-22T01:23:45"
}
```

Переменные окружения:

- `KAFKA_BOOTSTRAP_SERVERS` — bootstrap servers для Kafka, по умолчанию `localhost:9092`

В минимальной реализации дополнительная таблица статусов Kafka-команд не используется: после успешной публикации в Kafka операция дальше обрабатывается consumer-ом и попадает в БД, а UI узнаёт об изменении через WebSocket invalidation.

## 6) Realtime-обновление истории операций

Для realtime используется WebSocket/STOMP по паттерну `push invalidation`.

Параметры подключения:

- endpoint: `ws://localhost:9005/ws`
- STOMP `CONNECT` должен передавать header `Authorization: Bearer <access_token>`
- подписка на историю конкретного счёта: `/topic/accounts/{accountId}/transactions`

Что отправляет сервер:

```json
{
  "eventType": "TRANSACTIONS_INVALIDATED",
  "operationRequestId": "uuid",
  "accountId": "uuid",
  "changedAt": "2026-03-22T01:23:46"
}
```

После получения такого события клиентское приложение и приложение сотрудника должны заново вызвать:

- `GET /api/v1/accounts/{accountId}/transactions`

Причина выбора `push invalidation`, а не `push full data`:

- не дублируется серверная логика пагинации и фильтров истории операций
- по WebSocket передаётся короткое событие, а не целая страница данных
- источником истины для UI остаётся PostgreSQL + существующий REST endpoint

Для сотрудников backend также публикует отдельный broadcast-канал со всеми новыми операциями клиентов:

- подписка: `/topic/employee/operations`
- доступ разрешён только роли `EMPLOYEE`

Формат employee-события:

```json
{
  "eventType": "ACCOUNT_OPERATION_CREATED",
  "operationRequestId": "uuid",
  "operationType": "TRANSFER",
  "initiatedByUserId": "uuid",
  "accountIds": ["uuid"],
  "customerIds": ["uuid"],
  "changedAt": "2026-03-22T01:23:46"
}
```

## 7) Мониторинг и telemetry

Во все backend-сервисы через `common-module` добавлен общий HTTP telemetry filter.

Что собирается на каждый запрос:

- `traceId`
- имя сервиса
- HTTP-метод
- path
- статус ответа
- время выполнения в миллисекундах
- признак ошибки
- timestamp

Как это работает:

- каждый сервис логирует запрос в структурированном виде
- каждому запросу присваивается `X-Trace-Id` или используется входящий
- при межсервисных вызовах `X-Trace-Id` пробрасывается дальше через Feign
- telemetry best-effort отправляется в `monitoring-service`

`monitoring-service` предоставляет API для фронта и дашбордов:

- `POST /api/v1/monitoring/internal/telemetry` — внутренний ingest telemetry
- `GET /api/v1/monitoring/summary` — агрегированная статистика по сервису и интервалу
- `GET /api/v1/monitoring/timeline` — точки для графиков по времени
- `GET /api/v1/monitoring/errors/recent` — последние ошибки




