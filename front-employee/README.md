## Локальный запуск (без Docker)

```bash
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:5173`.
Vite dev-сервер автоматически проксирует API-запросы к бэкенд-сервисам (настроено в `vite.config.ts`).

## Запуск через Docker

### Сборка образа

```bash
docker build -t front-employee .
```

### Запуск контейнера

```bash
docker run -d -p 3000:80 --name front-employee front-employee
```

Приложение будет доступно на `http://localhost:3000`.
