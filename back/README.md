# Internet Bank Backend

## Что в репозитории

- `common-module` — общие DTO, security, утилиты. Подробности в `common-module/README.md`.
- `user-service` — пользователи, аутентификация, роли.
- `account-service` — счета и операции по счетам.
- `loan-service` — кредиты и взаимодействия с ними.

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

### PostgreSQL для каждого сервиса (compose внутри микросервисов)

`user-service`:

```bash
docker compose -f user-service/docker-compose.yml up -d
```

`account-service`:

```bash
docker compose -f account-service/docker-compose.yml up -d
```

Порты БД из compose:

- `user-service` DB: `localhost:5430` (db: `user`)
- `account-service` DB: `localhost:5435` (db: `account`)

## 2) Порты БД в конфигурации

`application.yml` уже настроены под compose микросервисов:

- `jdbc:postgresql://localhost:5430/user`
- `jdbc:postgresql://localhost:5435/account`

## 3) Запустить сервисы

Из корня проекта, в отдельных терминалах (используйте `.\gradlew.bat` на Windows, `./gradlew` на Linux/macOS):

```bash
.\gradlew.bat :user-service:bootRun
```

```bash
.\gradlew.bat :account-service:bootRun
```

Если установлен Gradle глобально, можно использовать `gradle` вместо `.\gradlew.bat`.

`common-module` отдельно не запускается (это библиотечный модуль).

## 4) Swagger

- User Service: `http://localhost:9000/swagger-ui/index.html`
- Account Service: `http://localhost:9005/swagger-ui/index.html`
- Loan Service: `http://localhost:9001/swagger-ui/index.html`

OpenAPI JSON:

- `http://localhost:9000/v3/api-docs`
- `http://localhost:9005/v3/api-docs`
- `http://localhost:9001/v3/api-docs`




