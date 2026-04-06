import os
import re
import logging
from typing import List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from keybert import KeyBERT
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("edulytix-ai")

# Global model holders 
sentiment_pipeline = None
kw_model = None
groq_client = None

SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
KEYWORD_MODEL   = "all-MiniLM-L6-v2"
GROQ_MODEL      = "llama-3.1-8b-instant"
MAX_ROWS        = 200
SUMMARY_SAMPLE  = 30


# Lifespan (replaces deprecated @app.on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    global sentiment_pipeline, kw_model, groq_client
    logger.info("Loading sentiment model …")
    sentiment_pipeline = pipeline(
        "sentiment-analysis",
        model=SENTIMENT_MODEL,
        tokenizer=SENTIMENT_MODEL,
        device=0 if torch.cuda.is_available() else -1,
        truncation=True,
        max_length=512,
    )
    logger.info("Loading KeyBERT model …")
    kw_model = KeyBERT(KEYWORD_MODEL)

    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        groq_client = Groq(api_key=groq_key)
        logger.info("Groq client initialised.")
    else:
        logger.warning("GROQ_API_KEY not set – summary generation disabled.")

    logger.info("All models ready.")
    yield
    logger.info("Shutting down AI service.")


# FastAPI app
app = FastAPI(
    title="Edulytix AI Service",
    description="NLP feedback analytics powered by RoBERTa, KeyBERT, and LLaMA 3.1",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request / Response schemas
class AnalysisRequest(BaseModel):
    feedbacks: List[str]


class AnalysisResponse(BaseModel):
    overall_sentiment: str
    sentiment_distribution: dict
    top_keywords: List[str]
    summary: str
    strengths: List[str]
    improvement_areas: List[str]


# Helpers
def clean_text(text: str) -> str:
    """Remove URLs, excess whitespace, and non-printable chars."""
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^\x20-\x7E]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def run_sentiment(texts: List[str]) -> List[dict]:
    """Run sentiment pipeline in chunks to avoid OOM."""
    results = []
    chunk_size = 64
    for i in range(0, len(texts), chunk_size):
        chunk = texts[i : i + chunk_size]
        batch = sentiment_pipeline(chunk, truncation=True, max_length=512)
        results.extend(batch)
    return results


def label_map(raw_label: str) -> str:
    """Normalise model-specific labels to Positive/Negative/Neutral."""
    label = raw_label.upper()
    if "POS" in label or label == "LABEL_2":
        return "Positive"
    if "NEG" in label or label == "LABEL_0":
        return "Negative"
    return "Neutral"


def extract_keywords(texts: List[str], top_n: int = 15) -> List[str]:
    """Extract top keywords from the concatenated corpus via KeyBERT with MMR."""
    corpus = " ".join(texts[:500])  # keep it manageable
    keywords = kw_model.extract_keywords(
        corpus,
        keyphrase_ngram_range=(1, 2),
        stop_words="english",
        use_mmr=True,
        diversity=0.5,
        top_n=top_n,
    )
    return [kw for kw, _ in keywords]


def generate_summary(sample_texts: List[str], distribution: dict) -> tuple[str, list, list]:
    """
    Use Groq LLaMA to generate a human-readable summary,
    plus structured strengths and improvement areas.
    Returns (summary, strengths, improvements).
    """
    if groq_client is None:
        return (
            "AI summary unavailable (GROQ_API_KEY not configured).",
            [],
            [],
        )

    joined = "\n- ".join(sample_texts[:SUMMARY_SAMPLE])
    dist_str = ", ".join(f"{k}: {v:.1f}%" for k, v in distribution.items())

    prompt = f"""You are an educational feedback analyst. Analyse the following student feedback samples.

Sentiment distribution: {dist_str}

Feedback samples:
- {joined}

Respond in the following JSON structure only (no markdown fences):
{{
  "summary": "<2-3 paragraph executive summary of the overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvement_areas": ["<area 1>", "<area 2>", "<area 3>"]
}}"""

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=800,
        )
        raw = completion.choices[0].message.content.strip()
        import json
        data = json.loads(raw)
        return (
            data.get("summary", ""),
            data.get("strengths", []),
            data.get("improvement_areas", []),
        )
    except Exception as exc:
        logger.error("Groq error: %s", exc)
        return (f"Summary generation failed: {exc}", [], [])


# Main endpoint
@app.post("/analyze-batch", response_model=AnalysisResponse)
async def analyze_batch(request: AnalysisRequest):
    feedbacks = request.feedbacks

    if not feedbacks:
        raise HTTPException(status_code=400, detail="No feedback texts provided.")

    # 1. Limit rows
    feedbacks = feedbacks[:MAX_ROWS]

    # 2. Clean
    cleaned = [clean_text(f) for f in feedbacks]
    cleaned = [f for f in cleaned if len(f) > 3]  # drop empties

    if not cleaned:
        raise HTTPException(status_code=422, detail="All feedback rows were empty after cleaning.")

    logger.info("Analysing %d feedback rows …", len(cleaned))

    # 3. Sentiment
    raw_results = run_sentiment(cleaned)
    label_counts: dict[str, int] = {"Positive": 0, "Negative": 0, "Neutral": 0}
    for r in raw_results:
        lbl = label_map(r["label"])
        label_counts[lbl] += 1

    total = len(raw_results)
    distribution = {k: round(v / total * 100, 2) for k, v in label_counts.items()}
    overall = max(label_counts, key=label_counts.get)

    # 4. Keywords
    keywords = extract_keywords(cleaned)

    # 5. Summary via Groq
    summary, strengths, improvements = generate_summary(cleaned, distribution)

    logger.info("Analysis complete. Sentiment: %s", overall)

    return AnalysisResponse(
        overall_sentiment=overall,
        sentiment_distribution=distribution,
        top_keywords=keywords,
        summary=summary,
        strengths=strengths,
        improvement_areas=improvements,
    )


@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": sentiment_pipeline is not None}
