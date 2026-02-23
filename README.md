# Edulytix

Edulytix is a full-stack AI-powered student feedback analytics platform that processes large batches of student feedback (via CSV upload) and generates structured insights using transformer models and Large Language Models (LLMs).

The system analyzes hundreds or thousands of feedback entries and produces:

- Overall sentiment classification
- Sentiment distribution (Positive / Neutral / Negative)
- Top recurring keywords and themes
- AI-generated executive summary
- Key strengths and areas for improvement

The application demonstrates a scalable microservices architecture integrating Angular (frontend), Spring Boot (backend), and Python FastAPI (AI service) with Groq-hosted LLMs.

---

## Features

- CSV upload with dynamic column selection
- Automatic large dataset handling (smart sampling up to 2000 rows)
- Batch transformer-based sentiment analysis
- Keyword extraction using KeyBERT with semantic diversity (MMR)
- AI-generated structured summary using Groq LLaMA 3.1
- Sentiment distribution aggregation
- Scalable microservices architecture
- Production-aware optimizations (batching + row limiting)

---

## Architecture

The application follows a three-service microservices architecture:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Angular   │ ───> │   Spring    │ ───> │   FastAPI   │
│  Frontend   │      │   Boot      │      │ AI Service  │
│  (4200)     │ <─── │  (8080)     │ <─── │  (8000)     │
└─────────────┘      └─────────────┘      └─────────────┘
```

### Processing Flow

1. User uploads a CSV file in the Angular frontend.
2. User selects the feedback column.
3. Spring Boot parses the CSV and extracts the selected column.
4. Extracted feedback rows are sent to FastAPI as a batch.
5. AI service:
   - Automatically limits rows if dataset is too large
   - Performs batched transformer sentiment inference
   - Aggregates sentiment distribution
   - Extracts semantic keywords
   - Generates AI-powered summary using Groq LLM
6. Structured analytics are returned and displayed in the UI.

---

## Component Details

### Frontend (`frontend/`)

- Angular (Standalone components)
- Tailwind CSS
- Angular HttpClient
- Angular Signals
- CSV upload + dynamic column selector
- Loading states + structured results display

Displays:
- Overall sentiment
- Sentiment distribution
- Top keywords
- AI-generated summary

---

### Backend (`backend/`)

- Spring Boot
- Java 17
- Maven
- Apache Commons CSV (for CSV parsing)
- RestTemplate (for AI service communication)

Responsibilities:
- Accept CSV upload
- Extract selected column
- Convert feedback rows into array
- Forward data to AI service
- Handle errors and fallback responses

---

### AI Service (`ai-service/`)

- FastAPI
- Transformers (HuggingFace)
- KeyBERT
- Groq SDK
- Uvicorn

#### Models Used

- `cardiffnlp/twitter-roberta-base-sentiment-latest`
- `all-MiniLM-L6-v2`
- `llama-3.1-8b-instant` (Groq)

#### AI Capabilities

- Batch sentiment inference (vectorized processing)
- Automatic dataset sampling (max 2000 rows)
- Sentiment aggregation using Counter
- Keyword extraction with MMR diversity
- Prompt-based LLM summary generation
- No hardcoded sentiment rules

---

## Technologies Used

### Frontend
- Angular
- TypeScript
- Tailwind CSS
- RxJS

### Backend
- Java
- Spring Boot
- Maven

### AI Service
- Python
- FastAPI
- Transformers
- KeyBERT
- Groq LLM
- Uvicorn

---

## Getting Started

### Prerequisites

- Node.js 20+
- Java 17+
- Maven
- Python 3.9+
- Groq API Key

---

## Installation & Running

### 1. Start AI Service

```bash
cd ai-service
pip install -r requirements.txt

```refer to .env.example for groq api key env file```

uvicorn app.main:app --reload --port 8000
```

### 2. Start Backend

```bash
cd backend
mvn spring-boot:run
```

### 3. Start Frontend

```bash
cd frontend
npm install
ng serve
```

Application runs at:

```
http://localhost:4200
```

---

## API Endpoints

### Backend

**POST** `/api/upload`

Accepts:
- CSV file
- Selected column name

---

### AI Service

**POST** `/analyze-batch`

Request:

```json
{
  "feedbacks": ["text1", "text2", "text3"]
}
```

Response:

```json
{
  "overall_sentiment": "Positive",
  "sentiment_distribution": { ... },
  "top_keywords": [ ... ],
  "summary": "..."
}
```

---

## Scalability Features

- Automatic row limiting (max 2000 rows)
- Batch transformer inference
- LLM sampling (first 50 entries for summary)
- Designed to handle very large CSV datasets safely

---

## How It Works (AI Logic)

1. Clean and validate feedback entries
2. Limit dataset size if necessary
3. Perform batched sentiment inference
4. Aggregate sentiment distribution
5. Extract top semantic keywords
6. Generate structured summary using LLM
7. Return analytics to frontend

---

## Future Improvements

- Async background job processing
- Redis queue integration
- Sentiment trend visualization
- Instructor comparison dashboard
- Authentication & role-based access

---

## License

This project is for educational and demonstration purposes.