# Edulytix — AI-Powered Student Feedback Analytics

Edulytix is a full-stack AI-powered student feedback analytics platform that processes large batches of student feedback (via CSV upload) and generates structured insights using transformer models and Large Language Models (LLMs).

> Upload CSV → Select column → Get AI-generated sentiment analysis, keywords & summary — all tied to your personal account.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│             Angular SPA  (port 4200 / :80)               │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP + JWT Bearer
┌───────────────────────▼──────────────────────────────────────┐
│          Spring Boot Backend  (port 8080)                    │
│  Auth · CSV parsing · Orchestration · PostgreSQL persistence │
└──────────┬────────────────────────────┬────────────────────--┘
           │ JPA                        │ WebClient (HTTP)
    ┌──────▼──────┐             ┌───────▼────────────────────┐
    │ PostgreSQL  │             │  FastAPI AI Service (8000) │
    │   (5432)   │             │  RoBERTa · KeyBERT · Groq  │
    └─────────────┘             └────────────────────────────┘
```

## Tech Stack

| Layer      | Technology                                         |
|------------|----------------------------------------------------|
| Frontend   | Angular, Standalone Components, Signals, CSS    |
| Backend    | Java, Spring Boot, Spring Security, JWT     |
| AI Service | Python, FastAPI, Transformers, KeyBERT, Groq  |
| Database   | PostgreSQL                                      |
| DevOps     | Docker, Docker Compose, Nginx                      |

---

## Project Structure

```
edulytix/
├── frontend/                        # Angular app
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── guards/              # authGuard
│   │   │   ├── interceptors/        # authInterceptor (JWT)
│   │   │   └── services/            # AuthService, FeedbackService
│   │   ├── features/
│   │   │   ├── auth/login/          # Login page
│   │   │   ├── auth/signup/         # Signup page
│   │   │   ├── dashboard/           # Home dashboard
│   │   │   ├── upload/              # CSV upload + column pick
│   │   │   ├── results/             # Analysis results view
│   │   │   └── history/             # Past analyses table
│   │   └── shared/
│   │       ├── components/          # NavbarComponent
│   │       └── models/              # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                         # Spring Boot app
│   └── src/main/java/com/edulytix/
│       ├── config/                  # SecurityConfig, WebClientConfig
│       ├── controller/              # AuthController, FeedbackController
│       ├── dto/                     # AuthDtos, AiDtos, AnalysisResponseDto
│       ├── entity/                  # User, FeedbackAnalysis
│       ├── repository/              # UserRepository, FeedbackAnalysisRepository
│       ├── security/                # JwtUtils, JwtAuthFilter
│       └── service/                 # AuthService, FeedbackService, UserDetailsServiceImpl
│
├── ai-service/                      # FastAPI NLP service
│   ├── main.py                      # All NLP logic + endpoints
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/
│   └── schema.sql                   # Reference PostgreSQL schema
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose v2+
- (Optional) Node, Java, Python for local dev

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/edulytix.git
cd edulytix

# Create environment file
cp .env.example .env
# Edit .env and set:
#   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
#   JWT_SECRET=your-strong-random-secret-32chars
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

> ⏳ First run downloads ~2 GB of ML models. Subsequent starts are fast.

| Service       | URL                       |
|---------------|---------------------------|
| Frontend      | http://localhost:4200      |
| Backend API   | http://localhost:8080      |
| AI Service    | http://localhost:8000      |
| PostgreSQL    | localhost:5432             |

### 3. Open the App

Navigate to **http://localhost:4200**, create an account, and upload a CSV.

---

## Local Development (without Docker)

### PostgreSQL

```bash
psql -U postgres
CREATE DATABASE edulytix;
CREATE USER edulytix1 WITH PASSWORD 'pass@1234';
GRANT ALL PRIVILEGES ON DATABASE edulytix TO edulytix_user;
```

### AI Service

```bash
cd ai-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### Spring Boot Backend

```bash
cd backend
./mvnw spring-boot:run
# Runs on http://localhost:8080
```

### Angular Frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:4200
```

---

## API Reference

### Auth (public)

| Method | Endpoint           | Body                        | Returns         |
|--------|--------------------|-----------------------------|-----------------|
| POST   | /api/auth/signup   | `{email, password}`         | `{token, email}`|
| POST   | /api/auth/login    | `{email, password}`         | `{token, email}`|

### Feedback (protected — requires `Authorization: Bearer <token>`)

| Method | Endpoint      | Params                           | Returns              |
|--------|---------------|----------------------------------|----------------------|
| POST   | /api/columns  | `file` (multipart)               | `["col1","col2",…]`  |
| POST   | /api/upload   | `file` (multipart), `column`     | `AnalysisResult`     |
| GET    | /api/history  | —                                | `AnalysisResult[]`   |

### AI Service (internal)

| Method | Endpoint        | Body                        | Returns              |
|--------|-----------------|-----------------------------|----------------------|
| POST   | /analyze-batch  | `{feedbacks: string[]}`     | `AnalysisResponse`   |
| GET    | /health         | —                           | `{status:"ok"}`      |

---

## AI Pipeline Details

```
CSV rows (up to 2000)
       │
       ▼
  Text cleaning (URLs, non-ASCII, whitespace)
       │
       ├──▶ cardiffnlp/twitter-roberta-base-sentiment-latest
       │         Batch inference (chunks of 64)
       │         → Positive / Negative / Neutral per row
       │         → Distribution percentages
       │
       ├──▶ KeyBERT (all-MiniLM-L6-v2)
       │         MMR diversity = 0.5
       │         Top 15 keywords/keyphrases
       │
       └──▶ Groq LLaMA 3.1 (llama-3.1-8b-instant)
                 Sample of 50 rows + distribution
                 → Executive summary (2-3 paragraphs)
                 → Top 3 strengths
                 → Top 3 improvement areas
```

---

## Environment Variables

### `ai-service/.env`
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```

### `backend/src/main/resources/application.properties`
```
spring.datasource.url=jdbc:postgresql://localhost:5432/edulytix
spring.datasource.username=edulytix_user
spring.datasource.password=edulytix_pass
app.jwt.secret=your-secret-min-32-chars
app.jwt.expiration-ms=86400000
ai.service.url=http://localhost:8000
```

---

## Security Notes

- Passwords hashed with BCrypt (strength 12)
- JWT tokens expire after 24 hours (configurable)
- All feedback endpoints require a valid JWT
- CORS restricted to localhost:4200 in development
- File upload capped at 50 MB
- AI rows capped at 2000 for performance

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| AI models fail to load | Ensure at least 4 GB RAM is available for Docker |
| `GROQ_API_KEY` error | Add key to `.env` and restart `ai-service` |
| CORS errors | Check backend `SecurityConfig` allowed origins match your frontend URL |
| JWT 401 errors | Token may be expired — log out and log in again |
| PostgreSQL connection refused | Wait for `postgres` healthcheck to pass before starting backend |

---

## License

MIT © Edulytix
