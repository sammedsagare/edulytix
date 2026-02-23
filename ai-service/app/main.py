from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from transformers import pipeline
from keybert import KeyBERT
from groq import Groq
import os
import random
from collections import Counter

from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# =====================================
# CONFIG
# =====================================

MAX_ROWS = 2000
BATCH_SIZE = 32

# =====================================
# Load Models ONCE
# =====================================

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

keyword_model = KeyBERT("all-MiniLM-L6-v2")

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# =====================================
# Request / Response Models
# =====================================

class BatchRequest(BaseModel):
    feedbacks: List[str]

class BatchResponse(BaseModel):
    overall_sentiment: str
    sentiment_distribution: Dict[str, int]
    top_keywords: List[str]
    summary: str

# =====================================
# Helper Functions
# =====================================

def limit_rows(feedbacks: List[str]) -> List[str]:
    if len(feedbacks) > MAX_ROWS:
        print(f"[INFO] Large dataset detected ({len(feedbacks)} rows). Sampling {MAX_ROWS}.")
        return random.sample(feedbacks, MAX_ROWS)
    return feedbacks


def aggregate_sentiment(feedbacks: List[str]):
    results = sentiment_pipeline(
        feedbacks,
        batch_size=BATCH_SIZE,
        truncation=True
    )

    sentiments = []

    for result in results:
        label = result["label"].lower()

        if "positive" in label:
            sentiments.append("positive")
        elif "negative" in label:
            sentiments.append("negative")
        else:
            sentiments.append("neutral")

    distribution = Counter(sentiments)
    overall = distribution.most_common(1)[0][0]

    return overall.capitalize(), distribution


def extract_keywords(feedbacks: List[str]):
    combined_text = " ".join(feedbacks)

    keywords_raw = keyword_model.extract_keywords(
        combined_text,
        keyphrase_ngram_range=(1, 3),
        stop_words="english",
        use_mmr=True,
        diversity=0.7,
        top_n=10
    )

    return [kw for kw, _ in keywords_raw]


def generate_summary(feedbacks: List[str]):

    sample_for_summary = feedbacks[:50]
    prompt = f"""
You are an educational analytics assistant analyzing student feedback.

Feedback entries:
{chr(10).join(sample_for_summary)}

Provide a brief analysis with:
1. Overall summary (5-7 sentences)
2. Key strengths observed
3. Areas for improvement

Keep the response simple and conversational. Use plain text only - no formatting, bold text, asterisks, or special characters.
"""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    return response.choices[0].message.content.strip()


# =====================================
# API Endpoint
# =====================================

@app.post("/analyze-batch", response_model=BatchResponse)
def analyze_batch(request: BatchRequest):

    feedbacks = [f.strip() for f in request.feedbacks if f.strip()]

    if not feedbacks:
        return {
            "overall_sentiment": "Neutral",
            "sentiment_distribution": {},
            "top_keywords": [],
            "summary": "No valid feedback provided."
        }

    # 🚀 Apply smart limiting
    feedbacks = limit_rows(feedbacks)

    # 🚀 Batch sentiment
    overall_sentiment, distribution = aggregate_sentiment(feedbacks)

    # 🚀 Keywords
    keywords = extract_keywords(feedbacks)

    # 🚀 LLM summary
    summary = generate_summary(feedbacks)

    return {
        "overall_sentiment": overall_sentiment,
        "sentiment_distribution": dict(distribution),
        "top_keywords": keywords,
        "summary": summary
    }