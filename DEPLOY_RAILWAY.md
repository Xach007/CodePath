# Deploy CodePath to Railway

Этот проект можно хостить на Railway одним web-сервисом: React собирается в `artifacts/learn/dist/public`, а Express API в production отдаёт и API, и готовый фронт.

## 1. Залей код на GitHub

Проверь, что все нужные изменения закоммичены и отправлены:

```bash
git status
git add railway.json DEPLOY_RAILWAY.md render.yaml .gitignore lib/db/src/index.ts artifacts/api-server/src/routes/google-auth.ts
git commit -m "Prepare Railway deployment"
git push origin master
```

Если `git status` показывает удалённые файлы диплома, сначала реши, надо ли их вернуть или тоже коммитить.

## 2. Создай проект в Railway

1. Открой [railway.com](https://railway.com).
2. Нажми `New Project`.
3. Выбери `Deploy from GitHub repo`.
4. Выбери репозиторий `Xach007/CodePath`.
5. Root directory оставь корнем репозитория.

Railway прочитает `railway.json` и возьмёт команды:

```bash
pnpm --filter @workspace/learn run build && pnpm --filter @workspace/api-server run build
node artifacts/api-server/dist/index.cjs
```

## 3. Добавь PostgreSQL

Внутри проекта Railway нажми `+ New` и добавь `PostgreSQL`.

После этого открой web-сервис CodePath, вкладка `Variables`, и добавь:

```text
NODE_ENV=production
APP_BASE_URL=https://codepath.ru
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=любая-длинная-случайная-строка
SUPPORT_EMAIL_TO=krokodil22009@gmail.com
```

Если Railway назвал базу не `Postgres`, выбери `DATABASE_URL` через выпадающую подсказку переменных и подставь имя своего PostgreSQL-сервиса.

## 4. Почта поддержки

Чтобы сообщения реально приходили на почту, добавь SMTP-переменные:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=твоя-почта@gmail.com
SMTP_PASS=пароль-приложения-google
SMTP_FROM=CodePath Support <твоя-почта@gmail.com>
```

Без этих переменных обращения будут сохраняться в админке, но письмо на email не уйдёт.

## 5. Проверь временную ссылку

В web-сервисе открой `Settings` -> `Networking` -> `Generate Domain`.

Railway даст ссылку вида:

```text
https://codepath-production.up.railway.app
```

Проверь:

```text
https://твоя-ссылка.up.railway.app/api/healthz
```

Должно открыться:

```json
{"ok":true}
```

## 6. Подключи codepath.ru

Когда временная ссылка работает:

1. В web-сервисе Railway открой `Settings` -> `Networking`.
2. Нажми `Custom Domain`.
3. Добавь `codepath.ru`.
4. Railway покажет DNS-записи `CNAME`/`ALIAS` или похожую запись для домена и `TXT` для проверки владения.
5. Добавь эти записи там, где куплен домен `codepath.ru`.
6. Подожди проверки домена и SSL.

Для `www.codepath.ru` добавь отдельный custom domain `www.codepath.ru`, если хочешь, чтобы работал и адрес с `www`.

## 7. Google login

Если включаешь вход через Google, в Google Cloud Console добавь redirect URL:

```text
https://codepath.ru/api/auth/google/callback
```

И добавь в Railway:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Важно

Railway не может работать с локальной `.codepath-pglite` базой на хостинге. Для production обязательно нужен PostgreSQL и переменная `DATABASE_URL`.
