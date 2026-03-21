# Keycloak

Этот файл описывает, как поднять `Keycloak` для проекта, как настроить его вручную и что нужно проверить, чтобы SSO корректно работал с:

- `user-service`
- `account-service`
- `loan-service`
- будущими фронтами `front-client` и `front-employee`
- локальным `Swagger` через `swagger-dev`

## Что должно получиться

В результате настройки:

- realm называется `internetbank`
- логин идет через страницу Keycloak, а не через backend сервисы
- пользователи имеют realm roles `CLIENT` и/или `EMPLOYEE`
- в токенах есть `email`, `realm_access.roles` и `user_id`
- проверки вида `#userId == principal.id` и `#userId != principal.id` работают и для Swagger, и для фронта

## Варианты запуска

Поддерживаются два способа:

1. локально без Docker
2. через `docker compose`

## Локальный запуск без Docker

### 1. Скачать Keycloak

Скачайте архив Keycloak с официального сайта:

- [https://www.keycloak.org/downloads](https://www.keycloak.org/downloads)

Распакуйте архив в любую локальную директорию, например:

- `C:\tools\keycloak-26.1.0`

### 2. Подготовить импорт realm

Скопируйте файл:

- `back/keycloak/realm/internetbank-realm.json`

в директорию импорта Keycloak:

- `C:\tools\keycloak-26.1.0\data\import\internetbank-realm.json`

### 3. Запустить Keycloak

Из каталога `bin` выполните:

```powershell
.\kc.bat start-dev --http-port 8080 --import-realm --bootstrap-admin-username admin --bootstrap-admin-password admin
```

После запуска откройте:

- Admin Console: `http://localhost:8080`
- Username: `admin`
- Password: `admin`

### 4. Как поменять порт при локальном запуске

Если `8080` занят, запустите Keycloak на другом порту, например `8082`:

```powershell
.\kc.bat start-dev --http-port 8082 --import-realm --bootstrap-admin-username admin --bootstrap-admin-password admin
```

После смены порта нужно обновить настройки backend сервисов.

Для `user-service` поменяйте:

- `spring.security.oauth2.resourceserver.jwt.issuer-uri`
- `keycloak.server-url`

в файле:

- `user-service/src/main/resources/application.yml`

Для `account-service` и `loan-service` можно использовать переменную окружения:

- `KEYCLOAK_ISSUER_URI`

Пример для PowerShell:

```powershell
$env:KEYCLOAK_ISSUER_URI = "http://localhost:8082/realms/internetbank"
```

## Запуск через Docker

В `back/docker-compose.yml` Keycloak публикуется как:

- внешний порт: `8081`
- внутренний порт контейнера: `8080`

### 1. Запуск

Из директории `back` выполните:

```bash
docker compose up -d keycloak
```

После запуска откройте:

- Admin Console: `http://localhost:8081`
- Username: `admin`
- Password: `admin`

### 2. Как поменять порт в Docker

Откройте файл:

- `back/docker-compose.yml`

Найдите строку:

```yaml
ports:
  - "8081:8080"
```

Если хотите публиковать Keycloak на `8082`, замените на:

```yaml
ports:
  - "8082:8080"
```

Затем перезапустите контейнер:

```bash
docker compose up -d keycloak
```

После этого:

- `user-service` должен смотреть на `http://localhost:8082`
- `account-service` и `loan-service` тоже должны использовать issuer с `8082`

## Что импортируется из realm файла

Файл:

- `back/keycloak/realm/internetbank-realm.json`

описывает:

- realm `internetbank`
- роли realm `CLIENT` и `EMPLOYEE`
- clients `front-client`, `front-employee`, `swagger-dev`, `user-service-admin`
- mapper `user_id` для токенов

Важно: если realm уже существовал раньше, часть изменений может не подтянуться автоматически. В таком случае настройте недостающие сущности вручную через админ-консоль.

## Ручная настройка realm

### Realm

Проверьте:

- `Realm name` = `internetbank`
- `Login with email` = `ON`
- `Duplicate emails` = `OFF`
- `Reset password` = `ON`

### Realm roles

Должны существовать роли:

- `CLIENT`
- `EMPLOYEE`

Если их нет, создайте вручную:

- `Realm roles`
- `Create role`

## Обязательная ручная настройка User Profile

Это важно для работы `principal.id`.

В админ-консоли перейдите:

- `Realm Settings`
- `User Profile`

Нажмите кнопку `Create Attribute`.

Заполните форму:

- `Name`: `user_id`
- `Display Name`: `User ID`
- `Required`: `OFF`
- `Can view`: `ON`

Сохраните атрибут кнопкой `Save`.

Итог: у пользователей появится кастомный атрибут `user_id`, который backend затем будет синхронизировать с локальным UUID из таблицы `users`.

## Настройка клиентов

### `front-client`

Путь:

- `Clients`
- `front-client`
- `Settings`

Значения:

- `Client authentication` = `OFF`
- `Authorization` = `OFF`
- `Standard flow` = `ON`
- `Direct access grants` = `OFF`
- `Service accounts roles` = `OFF`
- `Valid redirect URIs` = `http://localhost:5173/*`
- `Valid post logout redirect URIs` = `http://localhost:5173/*`
- `Web origins` = `http://localhost:5173`

### `front-employee`

Путь:

- `Clients`
- `front-employee`
- `Settings`

Значения:

- `Client authentication` = `OFF`
- `Authorization` = `OFF`
- `Standard flow` = `ON`
- `Direct access grants` = `OFF`
- `Service accounts roles` = `OFF`
- `Valid redirect URIs` = `http://localhost:5174/*`
- `Valid post logout redirect URIs` = `http://localhost:5174/*`
- `Web origins` = `http://localhost:5174`

### `swagger-dev`

Путь:

- `Clients`
- `swagger-dev`
- `Settings`

Значения:

- `Client authentication` = `OFF`
- `Authorization` = `OFF`
- `Standard flow` = `OFF`
- `Direct access grants` = `ON`
- `Service accounts roles` = `OFF`

Назначение:

- локальное получение `access_token` для Swagger без фронта
- использовать только для разработки

### `user-service-admin`

Путь:

- `Clients`
- `user-service-admin`
- `Settings`

Значения:

- `Client authentication` = `ON`
- `Authorization` = `OFF`
- `Standard flow` = `OFF`
- `Direct access grants` = `OFF`
- `Service accounts roles` = `ON`

После сохранения откройте:

- `Clients`
- `user-service-admin`
- `Credentials`

И скопируйте `Client secret` в конфигурацию `user-service`.

## Необходимые разрешения сервисного аккаунта

Для `user-service-admin` откройте:

- `Clients`
- `user-service-admin`
- `Service account roles`

Выберите client:

- `realm-management`

Назначьте роли:

- `manage-users`
- `view-users`
- `query-users`
- `view-realm`
- `query-clients`
- `view-clients`

Без этих разрешений `user-service` не сможет создавать пользователей, искать их и синхронизировать роли.

## Создание mapper `user_id`

Mapper нужен всем клиентам, чьи токены идут в backend:

- `front-client`
- `front-employee`
- `swagger-dev`

### Где создавать mapper

Если Keycloak показывает dedicated scope, используйте именно его:

- `Clients`
- выбрать нужный client
- `Client scopes`
- открыть `<client>-dedicated`
- вкладка `Mappers`

Примеры:

- `front-client-dedicated`
- `front-employee-dedicated`
- `swagger-dev-dedicated`

### Как создать mapper

Внутри настроек `swagger-dev-dedicated` перейдите на вкладку `Mappers`.

Нажмите:

- `Configure a new mapper`

или:

- `Create`

В списке выберите:

- `User Attribute`

Заполните поля:

- `Name`: `user_id`
- `User Attribute`: `user_id`
- `Token Claim Name`: `user_id`
- `Claim JSON Type`: `String`
- `Add to access token`: `ON`
- `Add to ID token`: `ON`
- `Add to userinfo`: `ON`

Сохраните mapper.

Точно такой же mapper должен быть создан для:

- `front-client-dedicated`
- `front-employee-dedicated`

Если dedicated scope не используется и UI показывает mapper'ы прямо в client, создайте тот же `User Attribute` mapper прямо внутри клиента.

## Синхронизация пользователей при запуске

`user-service` при старте синхронизирует локальных пользователей с Keycloak.

Ожидаемые дефолтные пользователи:

- `employee@example.com`
- `client@example.com`

После синхронизации:

- оба пользователя есть в `Users`
- `employee@example.com` имеет realm role `EMPLOYEE`
- `client@example.com` имеет realm role `CLIENT`
- у обоих заполнен атрибут `user_id`

Если `user_id` пустой:

1. проверьте `user-service-admin` и его права
2. перезапустите `user-service`
3. подождите до минуты, чтобы повторная синхронизация успела выполниться

## Настройка пароля для пользователей

Пароли из старой локальной аутентификации в Keycloak не переносятся.

При создании нового пользователя через backend в Keycloak автоматически задается временный пароль:

- `string1`

Этот пароль создается как temporary password, поэтому при первом обычном входе через страницу Keycloak пользователь должен будет сменить его.

Для каждого пользователя нужно вручную задать пароль:

- `Users`
- выбрать пользователя
- `Credentials`
- `Set password`

Рекомендации:

- снимите `Temporary`, если хотите использовать пароль сразу
- убедитесь, что у пользователя не осталось required action `Update Password`, если вы тестируете `swagger-dev` через password grant

Если хотите оставить пользователя со стартовым временным паролем:

- initial password = `string1`
- `Temporary` = `ON`

Если хотите получать токен через `swagger-dev` без интерактивной смены пароля:

- зайдите под пользователем в Keycloak Account Console или через страницу логина
- смените пароль
- либо вручную задайте новый пароль в `Credentials` и снимите `Temporary`

Если этого не сделать, возможна ошибка:

```text
invalid_grant: Account is not fully set up
```

## Как получить токен для Swagger без фронта

Для локальной отладки используйте client `swagger-dev`.

Пример PowerShell:

```powershell
$response = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/realms/internetbank/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body @{
    grant_type = "password"
    client_id = "swagger-dev"
    username = "employee@example.com"
    password = "<user-password>"
    scope = "openid email profile"
  }

$response.access_token
```

Пример `curl`:

```bash
curl -X POST "http://localhost:8080/realms/internetbank/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=swagger-dev" \
  -d "username=employee@example.com" \
  -d "password=<user-password>" \
  -d "scope=openid email profile"
```

В Swagger нужно вставлять именно `access_token`.

В корректном токене должны быть:

- `realm_access.roles`
- `email`
- `user_id`

## Когда заработает фронт

Да, после подключения фронта это будет работать.

Для этого нужны все условия сразу:

- у пользователя заполнен атрибут `user_id`
- у `front-client` или `front-employee` есть mapper `user_id`
- фронт получил новый `access_token` после всех изменений

Если пользователь вошел раньше, чем:

- ему назначили realm role
- добавили mapper
- синхронизировали `user_id`

то старый токен останется без нужных claims. В этом случае нужно:

1. выйти из Keycloak
2. войти заново
3. использовать новый `access_token`

## Что должно быть в токене

Для корректной работы backend проверок в токене должны быть:

- `realm_access.roles`
- `email`
- `user_id`

Если `user_id` отсутствует, backend увидит роль, но проверки на `principal.id` не будут работать корректно.

## Контрольный список проверки

1. Открывается `http://localhost:<port>/realms/internetbank/.well-known/openid-configuration`.
2. Существует realm `internetbank`.
3. Существуют realm roles `CLIENT` и `EMPLOYEE`.
4. В `Realm Settings -> User Profile` создан атрибут `user_id`.
5. Существуют clients `front-client`, `front-employee`, `swagger-dev`, `user-service-admin`.
6. Для `user-service-admin` включены `Client authentication` и `Service accounts roles`.
7. Для `user-service-admin` выданы роли `realm-management`.
8. Для `front-client`, `front-employee` и `swagger-dev` создан mapper `user_id`.
9. Пользователи `employee@example.com` и `client@example.com` существуют в Keycloak.
10. У пользователей назначены realm roles.
11. У пользователей заполнен атрибут `user_id`.
12. Пароли установлены вручную в `Credentials`.
13. Новый `access_token` содержит:
  - `realm_access.roles`
  - `email`
  - `user_id`