# MONEY (Capital Tracker)

Next.js App Router сервис учета личных расходов с Prisma + PostgreSQL.

## Требования

- Node.js 20+
- npm 10+
- Docker Desktop (для локального PostgreSQL)

## Установка

```bash
npm install
cp .env.example .env
```

## Переменные окружения

Минимально нужны:

- `DATABASE_URL`
- `AUTH_SECRET`

Опционально для dev-seed:

- `SEED_DEMO_USER` (`true` / `false`)
- `DEMO_USER_EMAIL` (только если `SEED_DEMO_USER=true`)
- `DEMO_USER_PASSWORD` (только если `SEED_DEMO_USER=true`)

## Локальная база

```bash
npm run db:up
npm run prisma:migrate
npm run prisma:seed
```

## Запуск в development

```bash
npm run dev
```

Открыть: `http://localhost:3000/login`

## Production-команды

```bash
npm run db:deploy
npm run build
npm run start
```

## Проверка состояния

- Healthcheck: `GET /api/health`
- Основные роуты:
  - `/login`
  - `/register`
  - `/dashboard`
  - `/add`
  - `/history`
  - `/analytics`
  - `/settings`
  - `/account`

## Деплой на сервер

```bash
git pull
npm install
cp .env.example .env
# отредактировать .env под production
npm run db:deploy
npm run build
npm run start
```

## Docker (production)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Примечания

- Seed по умолчанию **не** создает демо-пользователя.
- Для создания demo-аккаунта включите `SEED_DEMO_USER=true` и задайте `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`.
- Основные бизнес-данные (траты, бюджеты, категории, настройки уведомлений) хранятся в PostgreSQL.
