from fastapi import FastAPI
from pydantic import BaseModel
from keybert import KeyBERT
from typing import List

app = FastAPI()

# ===============================
# Load model once
# ===============================

keyword_model = KeyBERT("all-MiniLM-L6-v2")

# ===============================
# Request / Response models
# ===============================

class FeedbackRequest(BaseModel):
    text: str

class AnalysisResponse(BaseModel):
    sentiment: str
    keywords: List[str]

# ===============================
# Sentiment Lexicons (EDU DOMAIN)
# ===============================

POSITIVE_TERMS = {
    "good", "clear", "clearly", "helpful", "excellent",
    "amazing", "well", "engaging", "effective"
}

NEGATIVE_TERMS = {
    "poor", "poorly", "rude", "slow", "fast", "confusing",
    "unclear", "boring", "bad", "terrible"
}

BLACKLIST_WORDS = {
    "concepts", "thing", "things", "person", "teacher", "sir", "mr"
}

# ===============================
# Helper functions
# ===============================

def clean_keywords(keywords: List[str]) -> List[str]:
    seen = set()
    cleaned = []

    for kw in keywords:
        kw = kw.lower().strip()
        if kw not in seen:
            seen.add(kw)
            cleaned.append(kw)

    return cleaned


def filter_keywords(keywords: List[str]) -> List[str]:
    return [
        kw for kw in keywords
        if all(word not in BLACKLIST_WORDS for word in kw.split())
    ]


def infer_sentiment_from_keywords(keywords: List[str]) -> str:
    pos_score = 0
    neg_score = 0

    for kw in keywords:
        for word in kw.split():
            if word in POSITIVE_TERMS:
                pos_score += 1
            if word in NEGATIVE_TERMS:
                neg_score += 1

    if neg_score > pos_score:
        return "Negative"
    elif pos_score > neg_score:
        return "Positive"
    else:
        return "Neutral"

# ===============================
# API Endpoint
# ===============================

@app.post("/analyze", response_model=AnalysisResponse)
def analyze_feedback(request: FeedbackRequest):

    text = request.text.strip()

    if len(text) < 5:
        return {
            "sentiment": "Neutral",
            "keywords": []
        }

    # ---- Keyword Extraction ----
    try:
        keywords_raw = keyword_model.extract_keywords(
            text,
            keyphrase_ngram_range=(2, 3),
            stop_words="english",
            use_mmr=True,
            diversity=0.7,
            top_n=5
        )

        keywords = [kw for kw, _ in keywords_raw]
        keywords = clean_keywords(keywords)
        keywords = filter_keywords(keywords)

    except Exception as e:
        print("Keyword error:", e)
        keywords = []

    # ---- Sentiment from keywords ----
    sentiment = infer_sentiment_from_keywords(keywords)

    return {
        "sentiment": sentiment,
        "keywords": keywords
    }