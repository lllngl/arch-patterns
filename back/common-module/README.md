# Common Module

`common-module` — библиотечный модуль с переиспользуемыми компонентами для остальных сервисов (`user-service`, `account-service` и др.).

## Что здесь лежит

- `dtos` — общие DTO (например, `UserDTO`, `AccountDTO`, `PageRequestParams`).
- `audit` — аудит сущностей (`Auditable`, `SpringSecurityAuditorAware`).
- `security` — общие security-компоненты (OIDC resource server, principal, проверки доступа, конфигурация).
- `exceptions` — единый набор исключений и обработчик (`GlobalExceptionHandler`, `ApiErrorResponse`).
- `parameters` — утилиты для пагинации и фильтрации (`PageableUtils`, `SpecificationFilter`).
- `clients` — общие Feign-клиенты и конфиг для межсервисного взаимодействия.
- `config` — базовая OpenAPI-конфигурация.
- `enums` — общие перечисления (`RoleName`, `SortOption`).

## Как использовать в сервисах

Ниже типовые кейсы использования `common-module`.

### 1) Аудит сущностей

1. Включите JPA-аудит в приложении:
   - `@EnableJpaAuditing` на `*ServiceApplication`.
2. Наследуйте JPA-сущность от `Auditable`.
3. После этого поля `createdBy`, `createdAt`, `modifiedBy`, `modifiedAt` будут заполняться автоматически через `SpringSecurityAuditorAware`.

Пример:

```java
@Entity
public class Account extends Auditable {
    // поля сущности
}
```

### 2) Проверка существования пользователя через общий клиент

1. Включите Feign:
   - `@EnableFeignClients(basePackages = "com.internetbank.common.clients")`.
2. Инжектите `UserAppClient` в сервис.
3. Вызывайте `userAppClient.getUserById(userId)` перед созданием/изменением связанных данных.

Типовой паттерн:

```java
private void ensureUserExists(UUID userId) {
    userAppClient.getUserById(userId);
}
```

Если пользователь не найден, ошибка из downstream-сервиса будет декодирована в общее исключение (`NotFoundException` и т.д.) через `SecurityFeignClientConfig`.

### 3) Общая security-конфигурация

- Подключайте `SecurityConfig` через `@Import(...)`.
- Все сервисы валидируют JWT access token, выпущенный Keycloak, через `spring-security-oauth2-resource-server`.
- Для внутренних запросов используется `InternalRequestAuthenticationFilter` и `X-Internal-Request`.

### 4) Общие DTO и ошибки

- Используйте DTO из `common-module` для единых контрактов между сервисами.
- Используйте общие исключения (`BadRequestException`, `ForbiddenException`, `NotFoundException` и др.) для единообразной обработки ошибок.

### 5) Общий OpenAPI-конфиг

1. Создайте конфиг сервиса, который наследуется от `BaseOpenApiConfig`.
2. Переопределите только `getApiTitle()`.
3. В результате сервис получит единый OpenAPI-бин с JWT bearer-схемой (`bearerAuth`).

Пример:

```java
@Configuration
public class AccountOpenApiConfig extends BaseOpenApiConfig {
    @Override
    protected String getApiTitle() {
        return "Account Service API";
    }
}
```

### 6) Параметры пагинации и поиска

- Для пагинации/сортировки используйте `PageRequestParams` + `PageableUtils`.
- Для динамических фильтров используйте `SpecificationFilter` (строки ищутся через `like`, остальные типы через `equal`).

Пример пагинации:

```java
Pageable pageable = pageableUtils.of(pageRequestParams);
```

Пример фильтрации:

```java
Specification<Account> spec = specificationFilter.applyFilters(Map.of(
        "name", name,
        "status", status
));
```

### 7) Проверка владельца ресурса

`ResourceAccessService` реализует общий паттерн:
- достаёт ресурс из репозитория;
- кидает `NotFoundException`, если ресурса нет;
- проверяет владельца ресурса и роль пользователя;
- разрешает доступ владельцу и сотруднику (`RoleName.EMPLOYEE`), иначе кидает `ForbiddenException`.

Типовой вызов:

```java
Account account = resourceAccessService.getResourceAndCheckAuthorization(
        accountId,
        user,
        accountRepository,
        "Account",
        Account::getUserId
);
```