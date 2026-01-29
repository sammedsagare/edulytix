from fastapi import FastAPI
from pydantic import BaseModel
from textblob import TextBlob

app = FastAPI()

class FeedbackRequest(BaseModel):
    text: str

class AnalysisResponse(BaseModel):
    sentiment: str
    keywords: list[str]

@app.post("/analyze", response_model=AnalysisResponse)
def analyze_feedback(request: FeedbackRequest):
    blob = TextBlob(request.text)

    polarity = blob.sentiment.polarity

    if polarity > 0.1:
        sentiment = "Positive"
    elif polarity < -0.1:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    keywords = [
        word.lower()
        for word, tag in blob.tags
        if tag.startswith("NN")  # extract nouns as keywords
    ]

    return {
        "sentiment": sentiment,
        "keywords": list(set(keywords))[:5]
    }
