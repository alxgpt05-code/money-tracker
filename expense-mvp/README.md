# Expense MVP (Next.js + Prisma + PostgreSQL + PWA)

Минималистичный mobile-first сервис учета личных расходов с push-напоминаниями.

## 1) Структура проекта

```txt
expense-mvp/
  app/
    (auth)/login/page.tsx
    (app)/dashboard/page.tsx
    (app)/expenses/new/page.tsx
    (app)/history/page.tsx
    (app)/analytics/page.tsx
    (app)/notifications/page.tsx
    api/
      auth/login
      auth/logout
      expenses
      history
      analytics
      notifications/settings
      push/public-key
      push/subscribe
      push/unsubscribe
      jobs/send-daily-reminders
      categories
      health
    globals.css
    layout.tsx
    manifest.ts
  components/ui/
  lib/
    auth/
    db/
    server/
    client/
  prisma/
    schema.prisma
    seed.ts
    migrations/
  public/
    sw.js
    icons/
  Dockerfile
  docker-compose.yml
```

## 2) Быстрый старт локально

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Откройте `http://localhost:3000`.

Демо-логин по умолчанию:
- `userId`: `demo`
- `password`: `demo1234`

## 3) Переменные окружения

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/expense_mvp?schema=public"
DIRECT_URL="postgresql://postgres:postgres@db:5432/expense_mvp?schema=public"
JWT_SECRET="replace_me_long_random_string"
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@example.com"
CRON_SECRET="replace_me_cron_secret"
APP_URL="http://localhost:3000"
DEMO_USER_ID="demo"
DEMO_PASSWORD="demo1234"
```

Генерация VAPID ключей:

```bash
npx web-push generate-vapid-keys
```

## 4) Docker запуск

```bash
docker compose up -d --build
```

Проверка:

```bash
curl http://localhost:3000/api/health
```

## 5) Как отправлять ежедневные push по расписанию

Сервис предоставляет endpoint:

`POST /api/jobs/send-daily-reminders`

Секрет передаётся в заголовке `x-cron-secret`.

Пример cron на сервере (каждую минуту):

```bash
* * * * * curl -s -X POST https://YOUR_DOMAIN/api/jobs/send-daily-reminders -H "x-cron-secret: YOUR_CRON_SECRET" > /dev/null 2>&1
```

Логика отправки:
- берутся пользователи с `NotificationSettings.enabled = true`
- сравнивается локальное время пользователя (`timezone`) с `time`
- при совпадении отправляется 1 push за запуск

## 6) Прод деплой на сервер

1. Скопировать проект на сервер.
2. Заполнить `.env` боевыми значениями.
3. Запустить:

```bash
docker compose up -d --build
```

4. Проверить контейнеры:

```bash
docker compose ps
```

5. Проверить health:

```bash
curl http://127.0.0.1:3000/api/health
```

6. Настроить reverse proxy (Nginx/Caddy) на `app:3000`.
7. Добавить cron-задание для endpoint напоминаний.

## 7) Реализованный функционал

- Главный экран: итог за месяц, быстрые переходы, последние расходы.
- Добавление расхода: сумма, категория, дата, комментарий.
- История: фильтр по месяцу, список, редактирование/удаление.
- Аналитика: donut chart, список категорий, biggest/smallest.
- Уведомления: toggle, время, timezone, запрос разрешения, push subscription.
- PWA: `manifest`, `service worker`, push-обработчик.
- Server API: CRUD расходов, история, аналитика, настройки уведомлений, подписки, cron endpoint.
