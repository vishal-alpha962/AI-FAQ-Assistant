# AI FAQ Assistant

A secure REST API built with Node.js, Express, MongoDB, Mongoose, JWT, bcrypt and OpenAI.

## Features

- User registration and login
- JWT-protected routes
- Password hashing with bcrypt
- FAQ CRUD
- Pagination and category filtering
- MongoDB text search
- AI FAQ generation
- Embedding-based semantic search
- AI question answering grounded in stored FAQs
- Centralized error handling
- Helmet, CORS and API rate limiting

## 1. Requirements

- Node.js 18+
- npm
- MongoDB local installation OR MongoDB Atlas
- Optional OpenAI API key for AI features

## 2. Installation

```bash
npm install
```

Copy `.env.example` to `.env`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Edit `.env` and add your values.

## 3. Start

Development:

```bash
npm run dev
```

Normal:

```bash
npm start
```

Server:

```text
http://localhost:5000
```

## 4. API Endpoints

### Authentication

- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me` — Bearer token required

Register body:

```json
{
  "name": "Vishal",
  "email": "vishal@example.com",
  "password": "Password123"
}
```

### FAQs

- GET `/api/faqs`
- GET `/api/faqs/:id`
- POST `/api/faqs` — Bearer token required
- PUT `/api/faqs/:id` — owner/admin only
- DELETE `/api/faqs/:id` — owner/admin only
- GET `/api/faqs/search?q=node`
- GET `/api/faqs/semantic-search?q=how do I sign in`

Create FAQ body:

```json
{
  "question": "What is Node.js?",
  "answer": "Node.js is a JavaScript runtime used to run JavaScript outside the browser.",
  "category": "Backend",
  "tags": ["node", "javascript"]
}
```

### AI

- POST `/api/ai/generate` — Bearer token required
- POST `/api/ai/ask`

Generate body:

```json
{
  "topic": "MongoDB basics",
  "count": 5
}
```

Ask body:

```json
{
  "question": "How does Node.js work?"
}
```

## 5. Authorization

For protected endpoints send:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## 6. Testing Order

1. GET `/api/health`
2. POST `/api/auth/register`
3. POST `/api/auth/login`
4. Copy returned JWT
5. POST `/api/faqs`
6. GET `/api/faqs`
7. GET `/api/faqs/search?q=...`
8. POST `/api/ai/generate`
9. GET `/api/faqs/semantic-search?q=...`
10. POST `/api/ai/ask`

## 7. Important

Do not commit `.env`.
Do not expose `OPENAI_API_KEY` or `JWT_SECRET`.
The app still supports auth, CRUD and text search without an OpenAI API key.
