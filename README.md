# SwiftChat — Feel the Frequency

SwiftChat is a production-ready, AI-powered social media platform built natively with AI integration at its core. Emotion-aware semantic search, an AI caption studio, and an automated sentient observation stream.

## 🚀 System Architecture

SwiftChat is built on a highly scalable, service-oriented architecture:
- **Core Engine (MERN)**: React frontend communicating with a Node.js + Express backend, leveraging MongoDB Atlas for persistent storage and vector search.
- **High-Performance Caching**: Redis handles session management, rate limiting, and token blacklisting for robust security.
- **AI Microservices**: A cluster of Python FastAPI microservices processes NLP and connects to NVIDIA NIM endpoints to provide sentient streams and emotion analysis.
- **DevOps**: Docker and Docker Compose orchestrate the entire environment, with NGINX acting as the reverse proxy.

## 📖 API Documentation & Testing

**Interactive API Docs (Swagger):**
We use Swagger UI to continuously document our evolving API endpoints.
Once the backend is running, visit:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)** 

**Testing Infrastructure:**
The backend is fortified with `Jest` and `Supertest`.
Run `npm test` inside the `backend/` directory to execute our integration tests, which include mocking Redis data structures and verifying authentication lifecycles (e.g., token generation and blacklisting).

## 🌌 Key Features

1. **Emotion Pulse**: Global emotion awareness and sentiment tracking.
2. **AI Caption Studio**: High-speed caption generation with selectable tone using NVIDIA `llama-3.1-nemotron-nano-8b-v1`.
3. **Semantic Emotion Search**: Discover posts by feeling, not just keywords (powered by MongoDB Atlas Vector Search and `nv-embed-v1`).
4. **Sentient Stream**: Real-time mock trending vibe indicator.
5. **Microservices Architecture**: Graceful degradation—if NVIDIA APIs fail, services fall back to local rule-based mock responses natively.

## 🛠 Setup Instructions

### Environment Variables
1. Root `.env` files are not tracked in Git. You MUST define `.env` files for `backend/` and `ai-services/`.
2. Check `backend/.env.example` and `ai-services/.env.example`.
3. Provide your `NVIDIA_API_KEY`. (If omitted, services fall back to local mock data gracefully!).

### Running with Docker (Recommended)
You need Docker and Docker Compose installed.

```bash
docker compose up --build
```
> The app will be available on **http://localhost** via the NGINX reverse proxy.
> - Frontend: `http://localhost/`
> - Backend API: `http://localhost/api/`

### Running Locally (Without Docker)

You will need Postgres, MongoDB, and Redis running locally.

**1. AI Services (Terminals 1-5):**
```bash
cd ai-services/caption-service
pip install -r requirements.txt
uvicorn main:app --port 8001
# Repeat for emotion (8002), search (8003), chat (8004), moderation (8005)
```

**2. Backend (Terminal 6):**
```bash
cd backend
npm install
npx prisma db push
npm start
```

**3. Frontend (Terminal 7):**
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Security
- Secure JWT HTTP-Only authentication with refresh token strategies.
- Rate Limiters configured globally.
- Toxicity moderation scanning before posts are accepted (via AI service).

## 📡 API Flow
- **Client** → NGINX (Port 80)
- NGINX `/api/*` → Node.js **Backend**
- **Backend** proxies `/api/ai/*` → Python **FastAPI Microservices**.
