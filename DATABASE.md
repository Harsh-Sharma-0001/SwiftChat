# 🗄 Database Design — SwiftChat

## PostgreSQL Tables

### Users

* id (UUID)
* username
* email
* password_hash
* created_at

---

### Posts

* id
* user_id
* caption
* media_url
* embedding (vector)
* created_at

---

### Follows

* follower_id
* following_id

---

### Interactions

* id
* user_id
* post_id
* type (like/comment)

---

## pgvector

* Store embeddings for:

  * Posts
  * Captions
* Use cosine similarity

---

## MongoDB

* Chat logs
* Activity logs

---

## Redis

* Session store
* Feed cache
* Rate limiting
