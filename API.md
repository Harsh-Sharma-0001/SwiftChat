# 🔌 API Design — SwiftChat

## Auth

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

---

## Users

GET /api/users/:id
PUT /api/users/update
POST /api/users/follow

---

## Posts

POST /api/posts
GET /api/posts/feed
GET /api/posts/:id
DELETE /api/posts/:id

---

## Interactions

POST /api/like
POST /api/comment

---

## AI (Proxy APIs)

POST /api/ai/caption
POST /api/ai/search
POST /api/ai/chat
POST /api/ai/moderate

---

## Response Format

{
"success": true,
"data": {},
"message": ""
}
