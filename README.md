# SwiftChat — The Sentient Prism 🌌

<div align="center">

<img src="https://github.com/user-attachments/assets/d30ba98d-52fc-4e28-ba67-4cb5e8a0efc9" width="180" alt="SwiftChat Logo" />

### AI-Native Social Platform • Real-Time Interaction • Modular AI Service Mesh

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-SwiftChat-7c3aed?style=for-the-badge)](http://4.247.132.164/)
[![API Docs](https://img.shields.io/badge/📚_API_Documentation-Swagger-16a34a?style=for-the-badge)](http://4.247.132.164/api-docs/)
[![GitHub](https://img.shields.io/badge/💻_Source_Code-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Harsh-Sharma-0001/SwiftChat)

**A containerized, AI-native social platform that separates the core application layer from a specialized Python/FastAPI AI service mesh.**

</div>

---

## 🔗 Quick Access

| Resource | Link |
|---|---|
| 🚀 **Live Application** | **[http://4.247.132.164/](http://4.247.132.164/)** |
| 📚 **Live Swagger Documentation** | **[http://4.247.132.164/api-docs/](http://4.247.132.164/api-docs/)** |
| 💻 **GitHub Repository** | **[Harsh-Sharma-0001/SwiftChat](https://github.com/Harsh-Sharma-0001/SwiftChat)** |
| 📄 **License** | MIT |

> **Deployment note:** The current public deployment is served over HTTP from a static Azure public IP. HTTPS/TLS can be added when a domain and certificate are configured.

---

## 🧭 Table of Contents

- [What is SwiftChat?](#-what-is-swiftchat)
- [Why SwiftChat?](#-why-swiftchat)
- [Core Capabilities](#-core-capabilities)
- [Architecture at a Glance](#-architecture-at-a-glance)
- [Request Flow](#-request-flow)
- [AI Service Mesh](#-ai-service-mesh)
- [Application Architecture](#-application-architecture)
- [Real-Time Communication](#-real-time-communication)
- [Data & Infrastructure](#-data--infrastructure)
- [Technology Stack](#-technology-stack)
- [Docker Architecture](#-docker-architecture)
- [Nginx Gateway](#-nginx-gateway)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Local Development](#-local-development)
- [Environment Variables](#-environment-variables)
- [Docker Deployment](#-docker-deployment)
- [Azure Deployment](#-azure-deployment)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Design Decisions & Trade-offs](#-design-decisions--trade-offs)
- [Failure Handling & Production Considerations](#-failure-handling--production-considerations)
- [Future Roadmap](#-future-roadmap)
- [Interview-Ready Project Explanation](#-interview-ready-project-explanation)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🛰️ What is SwiftChat?

**SwiftChat** is an **AI-powered social platform** designed around real-time interaction and a modular intelligence layer.

Instead of implementing every capability inside one Node.js application, SwiftChat separates the system into a React frontend, Node/Express application backend, MongoDB, Redis, Nginx, and five specialized Python/FastAPI AI services.

The central architectural principle is:

> **SwiftChat separates the application control plane from the AI intelligence plane.**

The Node/Express backend owns application and business concerns, while specialized FastAPI services handle AI-specific workloads.

---

## 🎯 Why SwiftChat?

A traditional implementation could put authentication, social features, chat, search, moderation, media intelligence, and AI functionality into one backend.

SwiftChat intentionally separates those responsibilities.

### Key architectural benefits

- 🧩 **Modular architecture** — AI capabilities are isolated into dedicated services.
- 🔄 **Independent evolution** — individual AI services can change without redesigning the entire application.
- 🐍 **Runtime flexibility** — Python/FastAPI is used for the AI service layer.
- 🛡️ **Fault isolation** — services have clear boundaries.
- 🐳 **Reproducible environments** — Docker Compose defines the multi-service topology.
- 🌐 **Single public entry point** — Nginx hides internal application services behind one gateway.
- 📈 **Scaling potential** — AI services can theoretically scale independently.

The trade-off is additional deployment, networking, and operational complexity compared with a monolith.

---

## ✨ Core Capabilities

### 👤 Social Platform

- User-oriented social experiences
- Profile-oriented views
- Feed/content interaction
- Media handling
- AI-assisted interaction
- Real-time communication
- Notifications and user feedback
- Interactive AI/settings experiences

### 🤖 AI Service Mesh

| Service | Port | Responsibility |
|---|---:|---|
| 📝 Caption Service | `8001` | AI-assisted caption/media understanding |
| 🧠 Emotion Service | `8002` | Emotion-oriented AI processing |
| 🔎 Search Service | `8003` | Search and semantic/meaning-oriented retrieval |
| 💬 Chat Service | `8004` | Conversational AI and ARIA-related interaction |
| 🛡️ Moderation Service | `8005` | AI-assisted content moderation |

> Exact models, inference pipelines, thresholds, and algorithms should be described from the implementation rather than assumed from product terminology.

---

## 🧠 ARIA — Conversational AI Layer

**ARIA** is SwiftChat's conversational AI identity and assistant experience.

```text
User
  │
  ▼
React UI
  │
  ▼
Node / Express Backend
  │
  ▼
Chat Service
  │
  ├──► Search Service (when required)
  │
  └──► AI / Model Infrastructure
             │
             ▼
          AI Response
             │
             ▼
       Backend / Frontend
```

Keeping conversational functionality in a dedicated service prevents the main application backend from becoming tightly coupled to every AI runtime and dependency.

---

## 👁️ Multimodal Intelligence

SwiftChat is designed to support AI processing of different kinds of information, particularly conversational and media-related data.

The dedicated **Caption Service** provides the service boundary for AI-assisted media understanding and captioning.

```text
Media / User Input
       │
       ▼
Caption Service
       │
       ▼
AI Inference
       │
       ▼
Structured AI Result
       │
       ▼
Application Backend
       │
       ▼
User Experience
```

---

## 🔎 Semantic Search

SwiftChat's search layer is designed around **meaning-oriented retrieval**, rather than treating search as only simple string matching.

```text
Search Query
     │
     ▼
Search Service
     │
     ▼
Semantic / AI Processing
     │
     ▼
Relevant Results
```

The exact embedding, vector indexing, similarity algorithm, or RAG implementation should be treated as implementation-specific and verified from the source before being presented as a guaranteed feature.

---

## ✨ Product Concepts

### 📊 Flow State / Cognition %

An interactive visualization concept representing engagement, creative output, and AI-oriented interaction metrics.

### 🧠 Identity-Grounded ARIA

A conversational AI experience integrated into the user's application context.

### 🔗 Neural Mesh

The conceptual name for the distributed collection of specialized AI services.

### 🌌 Sentient Prism

The broader product concept behind SwiftChat's AI-native experience.

---

## 🏗️ Architecture at a Glance

```text
                              ┌─────────────────────┐
                              │        USER         │
                              │   Browser / Client  │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │       NGINX         │
                              │   Reverse Proxy     │
                              │       :80           │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │   React Frontend    │
                              │      :5173          │
                              └──────────┬──────────┘
                                         │
                                  API / Socket.IO
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  Node / Express     │
                              │     Backend :5000   │
                              └──────┬─────┬────────┘
                                     │     │
                       ┌─────────────┘     └─────────────────┐
                       ▼                                     ▼
              ┌────────────────┐                   ┌──────────────────┐
              │ MongoDB Atlas  │                   │      Redis       │
              │  Persistence   │                   │ In-memory layer  │
              └────────────────┘                   └──────────────────┘

                                     │
                                     ▼
                         ┌─────────────────────────┐
                         │   Python / FastAPI      │
                         │      AI Service Mesh    │
                         └────────────┬────────────┘
                                      │
              ┌──────────────┬────────┼────────┬──────────────┐
              ▼              ▼        ▼        ▼              ▼
          Caption         Emotion   Search    Chat        Moderation
           :8001           :8002     :8003    :8004          :8005
```

---

## 🔄 Request Flow

A typical AI-assisted request follows this general flow:

```text
1. User performs an action in the React interface.
                    │
                    ▼
2. Frontend sends an API request.
                    │
                    ▼
3. Nginx receives the external request.
                    │
                    ▼
4. Node/Express processes the request.
                    │
                    ▼
5. Backend performs authentication,
   authorization and application logic.
                    │
                    ▼
6. Backend calls the appropriate AI service
   when AI processing is required.
                    │
                    ▼
7. Specialized FastAPI service performs
   its AI-specific workflow.
                    │
                    ▼
8. AI service returns a structured result.
                    │
                    ▼
9. Backend applies application/business logic.
                    │
                    ▼
10. Response is returned to the frontend.
                    │
                    ▼
11. React updates the UI/state.
                    │
                    ▼
12. Socket.IO can be involved for
    real-time communication/events.
```

Not every feature necessarily follows every step; this is the architectural mental model.

---

## 🤖 AI Service Mesh

### 1. Caption Service — `:8001`

Responsible for AI-assisted caption and media-understanding functionality.

### 2. Emotion Service — `:8002`

Responsible for emotion-oriented AI processing.

### 3. Search Service — `:8003`

Responsible for search and meaning-oriented retrieval.

### 4. Chat Service — `:8004`

Responsible for conversational AI and ARIA-related functionality.

### 5. Moderation Service — `:8005`

Responsible for AI-assisted content moderation.

All five services are independently containerized and communicate with the application layer through internal service endpoints.

---

## 🎨 Application Architecture

### Frontend

The React application handles:

- UI rendering
- Client-side routing
- State management
- API communication
- Real-time interaction
- AI interaction interfaces
- Visualization
- Animations
- User feedback

### Frontend stack

- React 18
- Vite
- Redux Toolkit
- React Router
- Axios
- Socket.IO Client
- Framer Motion
- Recharts
- Tailwind CSS
- Lucide
- React Hot Toast

---

## ⚙️ Backend Architecture

The Node.js backend acts as the **central application/business layer and control plane**.

Responsibilities include:

- Authentication
- Authorization
- Application/business logic
- API endpoints
- Database interaction
- Redis interaction
- Media/upload handling
- AI-service orchestration
- Middleware
- Error handling
- Real-time communication
- Internal/external service integration

### Backend structure

```text
backend/src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── app.js
└── server.js
```

### Separation of concerns

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Models / External Services
```

This structure improves maintainability, testability, debugging, and independent evolution of business logic.

---

## 🔌 Real-Time Communication

SwiftChat uses **Socket.IO** for real-time communication.

```text
Client
  ↕
Socket Connection
  ↕
Backend
  ↕
Application Events
  ↕
Connected Clients
```

---

## 💾 Data & Infrastructure

### MongoDB Atlas

MongoDB is the primary persistence layer.

In the current Azure deployment, MongoDB is hosted externally through **MongoDB Atlas**, rather than as a database container on the application VM.

### Redis

Redis provides fast in-memory infrastructure and can support caching, temporary state, performance optimization, and application coordination depending on the feature.

Redis is not treated as the persistent source of truth.

### Media / Uploads

The backend contains:

```text
backend/uploads
```

Docker Compose mounts this directory into the backend container so uploaded application media can persist outside the container filesystem.

---

## 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, React Router, Axios, Socket.IO Client, Framer Motion, Recharts, Tailwind CSS |
| Backend | Node.js, Express.js, JWT, REST APIs, Socket.IO |
| Database | MongoDB Atlas |
| Cache / In-memory | Redis |
| AI Services | Python, FastAPI, PyMongo, NVIDIA NIM/model infrastructure |
| Orchestration | Docker, Docker Compose |
| Gateway | Nginx |
| Cloud | Microsoft Azure |
| Source Control | Git / GitHub |
| API Documentation | Swagger UI |

---

## 🐳 Docker Architecture

SwiftChat uses Docker Compose to orchestrate the application.

```text
Docker Compose
│
├── redis
├── backend
├── frontend
├── nginx
├── caption-service
├── emotion-service
├── search-service
├── chat-service
└── moderation-service
```

Services communicate over an internal Docker network using service names such as:

```text
caption-service:8001
emotion-service:8002
search-service:8003
chat-service:8004
moderation-service:8005
redis:6379
backend:5000
frontend:5173
```

### Public exposure

Only Nginx is intended to be publicly exposed:

```text
Internet
   │
   ▼
Nginx :80
   │
   ├──► Frontend
   ├──► Backend /api/
   ├──► Socket.IO
   ├──► Uploads
   └──► Swagger /api-docs/
```

Backend, Redis, and AI services remain internal to the Docker network.

---

## 🌐 Nginx Gateway

Nginx acts as the external gateway/reverse proxy.

```text
                 Internet
                    │
                    ▼
             ┌─────────────┐
             │    Nginx    │
             └──────┬──────┘
                    │
       ┌────────────┼─────────────┐
       ▼            ▼             ▼
   Frontend      Backend       Socket.IO
                    │
                    └──────► Internal AI Services
```

This provides a single public entry point and prevents clients from directly accessing every internal service.

---

## 📁 Project Structure

```text
SwiftChat/
│
├── .github/
│   └── workflows/
│
├── ai-services/
│   ├── caption-service/
│   ├── emotion-service/
│   ├── search-service/
│   ├── chat-service/
│   └── moderation-service/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── uploads/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   └── nginx.conf
│
├── nginx/
│   └── nginx.conf
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## 🔐 Security

Security-oriented practices include:

- JWT-based authentication infrastructure
- Authorization mechanisms
- CORS configuration
- Security middleware
- Input sanitization
- Environment-based secret management
- Internal Docker networking
- Public exposure limited to the Nginx gateway
- Production secrets kept outside the repository
- SSH-based Azure VM administration

### Secrets policy

Never commit real credentials.

Keep secrets in environment configuration such as:

```text
.env
```

and ensure it is excluded from Git.

Never put real API keys, database credentials, JWT secrets, or service keys in the README or public repository.

---

## 🧪 Local Development

### Prerequisites

- Git
- Node.js
- Docker Desktop
- Docker Compose
- MongoDB deployment (MongoDB Atlas recommended)

### Clone

```bash
git clone https://github.com/Harsh-Sharma-0001/SwiftChat.git
cd SwiftChat
```

### Configure environment

Create the required environment variables using the repository's environment examples as the source of truth.

### Start

```bash
docker compose up --build
```

Or detached:

```bash
docker compose up -d --build
```

Check services:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

---

## 🔑 Environment Variables

A deployment typically requires variables in these categories:

```env
NODE_ENV=production
PORT=5000

MONGODB_URI=<your-mongodb-uri>
REDIS_URL=redis://redis:6379

JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>

AI_SERVICE_KEY=<strong-random-service-key>
NVIDIA_API_KEY=<your-nvidia-key>

CLIENT_ORIGIN=<frontend-origin>
VITE_API_URL=/api
VITE_SOCKET_URL=/
```

> **Never put real production credentials in this README.**

---

## 🚀 Docker Deployment

Build:

```bash
docker compose build
```

Start:

```bash
docker compose up -d
```

Status:

```bash
docker compose ps
```

Logs:

```bash
docker compose logs -f
```

Restart:

```bash
docker compose restart
```

Stop:

```bash
docker compose down
```

The production Compose configuration uses restart policies so containers can automatically restart after common process failures or VM reboots.

---

## ☁️ Azure Deployment

SwiftChat is currently deployed on an **Azure Virtual Machine**.

### Current deployment

```text
                    Azure
                      │
                      ▼
          ┌────────────────────────┐
          │    Azure VM            │
          │  Standard_B2s_v2       │
          │  Ubuntu 24.04 LTS      │
          └───────────┬────────────┘
                      │
                      ▼
                Docker Compose
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
     Nginx         Backend         AI Mesh
       │              │              │
       │              ├────► Redis   │
       │              │              │
       │              └────► MongoDB Atlas
       │
       ▼
   Public HTTP
```

### Deployment characteristics

- Azure Virtual Machine
- Ubuntu 24.04 LTS
- Standard B2s_v2
- Static public IPv4
- Docker Engine
- Docker Compose
- Nginx
- MongoDB Atlas
- Redis
- Five FastAPI AI services
- Internal container networking
- Persistent backend uploads directory

### Live application

**http://4.247.132.164/**

### Live API documentation

**http://4.247.132.164/api-docs/**

---

## 📚 API Documentation

SwiftChat exposes interactive API documentation through **Swagger UI**.

### Live Swagger

👉 **[Open SwiftChat API Documentation](http://4.247.132.164/api-docs/)**

Swagger provides an interactive interface for inspecting documented endpoints, request parameters, authentication requirements, and responses.

---

## 🌍 Live Application

### 🚀 Try SwiftChat

👉 **[Open the Live Application](http://4.247.132.164/)**

### 📚 Explore the API

👉 **[Open Swagger UI](http://4.247.132.164/api-docs/)**

> The current deployment is intended as a live demonstration/evaluation environment and is currently served over HTTP from a static Azure public IP.

---

## 📸 Screenshots

### Identity-Grounded Chat — ARIA

<img width="100%" alt="SwiftChat ARIA Chat Interface" src="https://github.com/user-attachments/assets/3e0569cb-5d8f-425a-a9df-76739fc0b337" />

<img width="100%" alt="SwiftChat ARIA Conversation Interface" src="https://github.com/user-attachments/assets/31d13381-f090-4244-bc0d-9fb6d4df611b" />

### Live Flow State — Cognition %

<img width="100%" alt="SwiftChat Flow State" src="https://github.com/user-attachments/assets/0d7125ed-f1bc-4bd0-acff-27ceda039f79" />

<img width="100%" alt="SwiftChat AI Insights" src="https://github.com/user-attachments/assets/b584489d-b884-4b25-b3f5-01835bba65e1" />

<img width="100%" alt="SwiftChat Cognitive Visualization" src="https://github.com/user-attachments/assets/fe8a5936-ae88-43f7-bbe9-ade8e1e314fa" />

---

## ⚖️ Design Decisions & Trade-offs

### Why separate AI services?

AI capabilities can have different runtime requirements, dependencies, model integrations, resource requirements, and failure modes.

Separating them allows the Node application backend to remain focused on application/business logic.

**Trade-off:** more containers, networking, deployment complexity, and operational overhead.

### Why Python/FastAPI?

Python provides a mature ecosystem for AI, machine learning, NLP, computer vision, inference, and data processing. FastAPI provides a clean HTTP service boundary.

### Why Docker?

SwiftChat contains multiple runtimes and infrastructure components. Docker isolates those environments, while Compose defines the complete service topology.

### Why Nginx?

Nginx provides a single public gateway. External clients do not need direct access to backend and AI service ports.

---

## ⚠️ Failure Handling & Production Considerations

A distributed architecture introduces additional failure scenarios.

### AI service failure

A production evolution could use:

```text
Backend
   │
   ▼
AI Service
   │
   ├── Success ───────► Response
   │
   └── Failure
          │
          ▼
       Timeout
          │
          ▼
     Limited Retry
          │
          ▼
   Graceful Degradation
```

Potential improvements:

- Timeouts
- Retry policies
- Exponential backoff
- Circuit breakers
- Health checks
- Queue-based processing
- Monitoring
- Fallback strategies

These are production evolution strategies, not claims that every mechanism is already implemented.

### MongoDB failure

Possible production improvements include:

- Managed database infrastructure
- Replica sets
- Backups
- Monitoring
- Connection retry policies
- Disaster recovery

### Redis failure

Possible improvements include:

- Health checks
- Reconnection
- Graceful degradation
- Monitoring
- Avoiding Redis as the persistent source of truth

---

## 📈 Performance Considerations

Potential latency points:

```text
Frontend
   │
   ▼
Network
   │
   ▼
Nginx
   │
   ▼
Backend
   │
   ▼
Database / Redis
   │
   ▼
AI Service
   │
   ▼
AI Inference
```

Potential optimization strategies:

- Database indexing
- Efficient queries
- Caching
- Request batching
- Async processing
- Model optimization
- Smaller models where appropriate
- Connection reuse
- Timeouts
- Queue-based processing
- Horizontal scaling
- CDN for static/media assets

No performance percentage or latency figure should be claimed without measurement.

---

## 🔭 Future Roadmap

### Infrastructure

- [ ] HTTPS/TLS with a custom domain
- [ ] Azure monitoring and alerting
- [ ] Centralized logging
- [ ] Distributed tracing
- [ ] Health dashboards
- [ ] Automated deployment pipeline

### Scalability

- [ ] Load balancing
- [ ] Multiple backend instances
- [ ] Independent AI-service scaling
- [ ] GPU-backed AI infrastructure
- [ ] Kubernetes
- [ ] Autoscaling

### Reliability

- [ ] Circuit breakers
- [ ] Exponential-backoff retries
- [ ] Service health checks
- [ ] Queue-based AI processing
- [ ] Graceful degradation
- [ ] Automated backups

### Security

- [ ] HTTPS everywhere
- [ ] Stronger secrets management
- [ ] Rate limiting
- [ ] Restrictive network access
- [ ] File-upload hardening
- [ ] AI abuse prevention
- [ ] Prompt-injection defenses
- [ ] Container hardening

### Observability

- [ ] Prometheus
- [ ] Grafana
- [ ] Centralized logs
- [ ] Distributed tracing
- [ ] AI inference metrics
- [ ] Service health dashboards

---

## 🧑‍💻 Interview-Ready Project Explanation

### 30-second version

> **SwiftChat is an AI-powered social platform that I designed as a multi-service application rather than a traditional monolithic MERN project. The frontend uses React, while Node.js and Express form the main application backend. MongoDB handles persistence and Redis provides fast in-memory infrastructure. The main architectural decision was separating AI functionality into five specialized Python/FastAPI services for chat, search, emotion analysis, captioning, and moderation. Docker Compose orchestrates the services and Nginx acts as the gateway. This separation keeps business logic independent from AI-specific runtimes and makes the intelligence layer easier to evolve independently.**

### Core architecture

```text
React
  ↓
Nginx
  ↓
Node / Express
  ├── MongoDB
  ├── Redis
  └── AI Service Mesh
       ├── Chat
       ├── Search
       ├── Emotion
       ├── Caption
       └── Moderation
```

### Key architectural principle

> **Application control plane + specialized AI intelligence plane.**

---

## 🧩 Engineering Decision Framework

SwiftChat architecture can be explained using:

```text
Problem
   ↓
Constraint
   ↓
Decision
   ↓
Trade-off
   ↓
Result
```

### Example: Why microservices?

**Problem:** AI capabilities have different responsibilities and dependencies.

**Constraint:** The Node backend should not become tightly coupled to every AI runtime and model dependency.

**Decision:** Separate AI capabilities into independent FastAPI services.

**Trade-off:** More deployment and networking complexity.

**Result:** AI capabilities become independently maintainable and replaceable.

---

## 🧪 Current vs Future

### Current architecture

- React frontend
- Node.js / Express backend
- MongoDB Atlas
- Redis
- Nginx
- Docker / Docker Compose
- Five FastAPI AI services
- Socket.IO
- Azure VM deployment
- Static public IP
- Swagger API documentation

### Future possibilities

- Kubernetes
- GPU node pools
- Managed Redis
- Advanced autoscaling
- Message queues
- API gateway
- Distributed tracing
- Prometheus/Grafana
- CDN
- Automated CI/CD
- Advanced model evaluation

Future architecture should never be presented as already implemented.

---

## 🤝 Contributing

```bash
git clone https://github.com/Harsh-Sharma-0001/SwiftChat.git
cd SwiftChat

git checkout -b feature/your-feature

# Make changes

git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature
```

When contributing:

- Keep services modular.
- Never commit secrets.
- Keep environment-specific configuration outside source code.
- Update documentation when architecture changes.
- Prefer focused commits.
- Validate Docker Compose before submitting infrastructure changes.

---

## 📜 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for details.

---

## 👨‍💻 Author

<div align="center">

### Harsh Sharma

**B.Tech — Computer Science & Engineering**

`Full-Stack Development` • `AI Engineering` • `Distributed Systems` • `Cloud & DevOps`

[![GitHub](https://img.shields.io/badge/GitHub-Harsh--Sharma--0001-181717?style=for-the-badge&logo=github)](https://github.com/Harsh-Sharma-0001)

</div>

---

<div align="center">

## 🌌 Explore SwiftChat

**[🚀 Live Application](http://4.247.132.164/)**  
**[📚 Swagger API Documentation](http://4.247.132.164/api-docs/)**  
**[💻 GitHub Repository](https://github.com/Harsh-Sharma-0001/SwiftChat)**

<br />

**Built with React • Node.js • Python • Docker • MongoDB • Redis • Nginx**

⭐ If you find the architecture interesting, consider starring the repository.

</div>
