# Edulytix

Edulytix is a full-stack web application for AI-powered student feedback analysis. Students can submit feedback through a modern UI, which is then processed using Natural Language Processing (NLP) to determine sentiment and extract relevant keywords. 

The application demonstrates microservices architecture with seamless integration between Angular (frontend), Java Spring Boot (backend), and Python (AI service).

## Features

- Modern, responsive dark-themed UI built with Angular 21 and Tailwind CSS 4
- AI-powered sentiment analysis (Positive/Negative/Neutral)
- Intelligent keyword extraction using KeyBERT with custom domain-specific filtering
- Real-time feedback analysis with visual results display
- RESTful API integration between services
- Fast and efficient processing with educational domain optimization

## Architecture

The application follows a microservices architecture with three main components:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Angular   │ ───> │   Spring    │ ───> │   FastAPI   │
│  Frontend   │      │   Boot      │      │ AI Service  │
│  (Port 4200)│ <─── │  (Port 8080)│ <─── │ (Port 8000) │
└─────────────┘      └─────────────┘      └─────────────┘
```

### Component Details

#### Frontend (`frontend/`)
- **Framework**: Angular 21 with Server-Side Rendering (SSR)
- **Styling**: Tailwind CSS
- **HTTP Client**: Angular HttpClient for API communication
- **Features**: Reactive forms, real-time loading states, color-coded sentiment display

#### Backend (`backend/`)
- **Framework**: Spring Boot 4.0.2
- **Java Version**: 17
- **API**: RESTful endpoints with CORS support
- **Role**: Acts as middleware between frontend and AI service, handles request routing and error fallbacks

#### AI Service (`ai-service/`)
- **Framework**: FastAPI
- **NLP Engine**: KeyBERT with all-MiniLM-L6-v2 model
- **Capabilities**:
  - Keyword extraction using MaxSum Marginal Relevance (MMR) for diversity
  - Custom educational domain sentiment analysis
  - Intelligent filtering with domain-specific blacklists
  - Keyphrase extraction with 2-3 word n-grams

## Technologies Used

### Frontend
- Angular 
- TypeScript 
- Tailwind CSS 
- RxJS 
- Angular SSR & Express

### Backend
- Java 
- Spring Boot 
- Maven
- RestTemplate for HTTP communication

### AI Service
- Python
- FastAPI
- KeyBERT
- sentence-transformers (all-MiniLM-L6-v2)
- Uvicorn ASGI server

## Getting Started

### Prerequisites
- **Node.js** 20+ and npm (for frontend)
- **Java** 17+ and Maven (for backend)
- **Python** 3.8+ and pip (for AI service)

### Installation & Running

#### 1. AI Service (Start First)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Backend (Start Second)
```bash
cd backend
mvn spring-boot:run
```

#### 3. Frontend (Start Last)
```bash
cd frontend
npm install
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200`

## API Endpoints

### Backend API
- **POST** `/api/feedback` - Submit feedback for analysis
  - Request: `{ "text": "string" }`
  - Response: `{ "sentiment": "string", "keywords": ["string"] }`

### AI Service API
- **POST** `/analyze` - Analyze text and extract sentiment/keywords
  - Request: `{ "text": "string" }`
  - Response: `{ "sentiment": "string", "keywords": ["string"] }`

## How It Works

1. **User Input**: Student enters feedback in the Angular frontend
2. **Request Flow**: Frontend sends POST request to Spring Boot backend
3. **AI Processing**: Backend forwards request to FastAPI AI service
4. **Analysis**: 
   - KeyBERT extracts top 5 relevant keywords (2-3 word phrases)
   - Custom algorithm infers sentiment from educational domain lexicons
   - Filters out generic terms and duplicates
5. **Response**: Results flow back through backend to frontend
6. **Display**: UI shows color-coded sentiment and keyword tags

## Project Structure

```
edulytix/
├── frontend/          # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   └── feedback-form/  # Main component
│   │   └── styles.css          # Global styles
│   └── package.json
│
├── backend/           # Spring Boot application
│   ├── src/main/java/com/edulytix/backend/
│   │   ├── controllers/  # REST controllers
│   │   ├── service/      # AI client service
│   │   └── dto/          # Data transfer objects
│   └── pom.xml
│
└── ai-service/        # Python FastAPI service
    ├── app/
    │   └── main.py    # NLP analysis logic
    └── requirements.txt
```

## Development Notes

- The AI service uses domain-specific lexicons optimized for educational feedback
- Custom blacklist filters out non-informative keywords like "teacher", "person", "things"
- Backend includes error handling with neutral fallback responses
- Frontend uses Angular signals for reactive state management
- All services support hot-reload during development

## License

This project is for educational purposes.