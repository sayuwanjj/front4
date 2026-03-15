# Контрольная работа 1 — Frontend и Backend

## Что сделано
- Реализован backend на Node.js + Express.
- Реализованы CRUD-эндпоинты для сущности `Product`:
  - GET `/api/products`
  - GET `/api/products/:id`
  - POST `/api/products`
  - PATCH `/api/products/:id`
  - DELETE `/api/products/:id`
- Подключен Swagger:
  - Swagger UI: `/api-docs`
  - Описана схема `Product` и все маршруты.
- Добавлена валидация для POST `/api/products`:
  - `title`, `category`, `description` — обязательные непустые строки
  - `price` — число, `>= 0`
  - `stock` — целое число, `>= 0`
  - При ошибке возвращается `400` и JSON с деталями.

## Запуск backend
npm install
node app.js

Backend: http://localhost:3000
Swagger UI: http://localhost:3000/api-docs

Запуск frontend
npm install
npm start

Frontend: http://localhost:3001
