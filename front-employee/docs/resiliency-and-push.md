# `front-employee` Resiliency And Push

## Что реализовано

- HTTP-слой теперь автоматически добавляет `X-Trace-Id`, `X-Request-Id` и `Idempotency-Key` для mutating-запросов.
- Для `users-service`, `account-service` и `loan-service` добавлены frontend-side retry и client-side circuit breaker.
- Добавлен telemetry buffer с отправкой событий в monitoring ingest endpoint, если задан `VITE_MONITORING_INGEST_URL`.
- Realtime/STOMP дополнен явной диагностикой состояний и telemetry-событиями.
- Добавлен web push scaffold: manifest, service worker и Firebase Messaging bootstrap.

## Аудит realtime/WebSocket

- Сейчас realtime используется только на странице деталей счёта через `push invalidation`.
- Поток остаётся account-scoped: employee app не получает общий поток операций по всем клиентам.
- При отсутствии WS URL, токена или при ошибке транспорта UI теперь явно показывает, что экран перешёл в `REST only`.
- Для полного employee-wide realtime/push сценария backend всё ещё должен отдать отдельный topic/payload для всех операций сотрудников.

## Новые env

- `VITE_HTTP_TIMEOUT_MS`: общий timeout для HTTP-клиента.
- `VITE_HTTP_RETRY_ENABLED`: включает retry для нестабильных `5xx`.
- `VITE_HTTP_RETRY_MAX_ATTEMPTS`: число повторных попыток.
- `VITE_HTTP_RETRY_BASE_DELAY_MS`: базовый backoff.
- `VITE_HTTP_RETRY_JITTER_MS`: джиттер для retry.
- `VITE_HTTP_CIRCUIT_BREAKER_ENABLED`: включает client-side circuit breaker.
- `VITE_HTTP_CIRCUIT_BREAKER_WINDOW_SIZE`: размер окна результатов.
- `VITE_HTTP_CIRCUIT_BREAKER_MINIMUM_SAMPLES`: минимальное число запросов до открытия breaker.
- `VITE_HTTP_CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENT`: порог процента ошибок.
- `VITE_HTTP_CIRCUIT_BREAKER_OPEN_MS`: длительность open-state.
- `VITE_MONITORING_INGEST_URL`: endpoint monitoring service для приёма telemetry.
- `VITE_MONITORING_BATCH_SIZE`: размер telemetry batch.
- `VITE_MONITORING_FLUSH_INTERVAL_MS`: задержка между flush.
- `VITE_PUSH_AUTO_INIT_ENABLED`: автозапуск push bootstrap после входа сотрудника.
- `VITE_PUSH_REGISTRATION_URL`: backend endpoint для регистрации FCM token.
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`

## Явные блокеры

- Без ingest API monitoring service telemetry остаётся frontend-side буфером и graceful no-op.
- Без backend endpoint для регистрации push token `front-employee` не может завершить связку web client -> notification service.
- Без Firebase project/config push bootstrap не сможет получить FCM token.
- Без backend payload/топика для employee-wide операций нет end-to-end уведомлений по всем клиентам.
- Client-side circuit breaker защищает UI от лавины ошибок, но не заменяет backend retry/circuit breaker между микросервисами.
- Архитектура `front-employee` по-прежнему переходная: часть экранов ходит в `api` напрямую, а не через полноценные `use-cases`.
