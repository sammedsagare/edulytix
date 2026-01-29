# Edulytix

Edulytix is a web application for AI-based student feedback analysis. It enables students to submit feedback, which is processed using Natural Language Processing (NLP) to determine sentiment and extract keywords. The project demonstrates full-stack integration using Angular (frontend), Java Spring Boot (backend), and Python (AI service).

As of this commit (#3), this is a very basic project with a clean UI. Yet to be updated. Stay tuned for more!

## Project Structure

- **frontend/**: Angular application for the user interface
- **backend/**: Java Spring Boot application for API and data management
- **ai-service/**: Python service for AI/NLP-based text analysis

## Technologies Used

- **Angular** (frontend)
- **Java Spring Boot** (backend)
- **Python** (AI/NLP service)

## Getting Started

### Prerequisites
- Angular, Node.js & npm (for frontend)
- Java 17+ & Maven (for backend)
- Python 3.8+ (for AI service)

### Running the Applications:

#### Frontend
```
cd frontend
npm install
ng serve
```

#### Backend
```
cd backend
mvn spring-boot:run
```

#### AI Service
```
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Folder Overview

- `frontend/` - Angular app source code
- `backend/` - Java Spring Boot backend
- `ai-service/` - Python AI/NLP microservice

## License

This project is for educational purposes.