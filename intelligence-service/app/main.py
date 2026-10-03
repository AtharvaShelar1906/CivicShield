from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

from app.schemas import (
    GrievanceAnalysisRequest,
    GrievanceAnalysisResponse,
    HealthResponse
)
from app.classifier import classifier
from app.severity import analyze_severity_and_priority
from app.similarity import compute_grievance_similarity
from app.anomaly import detect_anomaly

app = FastAPI(
    title="Secure Citizen Grievance Intelligence Service",
    description="Isolated NLP & Intelligence service providing categorization, severity estimation, duplicate detection, and anomaly detection.",
    version="1.0.0"
)

# Enable CORS for backend communication and testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Returns the operational status and service metadata.
    """
    return HealthResponse(
        status="ok",
        service="Secure Citizen Grievance Intelligence Service",
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat(),
        environment=os.getenv("ENVIRONMENT", "development")
    )

@app.post("/analyze", response_model=GrievanceAnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_grievance(request: GrievanceAnalysisRequest):
    """
    Analyzes a civic complaint:
      1. Predicts authoritative category and confidence using local TF-IDF classifier.
      2. Computes explainable severity score and maps to priority tier (LOW, MEDIUM, HIGH, CRITICAL).
      3. Scans for potential duplicate complaints via TF-IDF cosine similarity against existing candidates.
      4. Detects anomalies, spam, or gibberish text patterns.
    """
    try:
        combined_text = f"{request.title} {request.description}".strip()

        # 1. Category Classification
        predicted_category, category_confidence = classifier.predict(combined_text)

        # 2. Severity and Priority Estimation
        severity_score, predicted_priority = analyze_severity_and_priority(request.title, request.description)

        # 3. Anomaly Detection
        is_anomalous, anomaly_reason = detect_anomaly(request.title, request.description)

        # 4. Duplicate / Similarity Detection against candidate grievances
        similarities = compute_grievance_similarity(
            current_title=request.title,
            current_description=request.description,
            existing_grievances=request.existingGrievances or []
        )

        return GrievanceAnalysisResponse(
            predictedCategory=predicted_category,
            categoryConfidence=category_confidence,
            severityScore=severity_score,
            predictedPriority=predicted_priority,
            isAnomalous=is_anomalous,
            anomalyReason=anomaly_reason,
            similarities=similarities,
            modelVersion="scikit-tfidf-v1.0.0"
        )
    except Exception as e:
        print(f"[Analyze Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Intelligence pipeline error: {str(e)}"
        )

@app.get("/")
def root():
    return {
        "service": "Secure Citizen Grievance Intelligence Service",
        "health": "/health",
        "docs": "/docs",
        "analyze": "/analyze"
    }
