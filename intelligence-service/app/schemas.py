from pydantic import BaseModel, Field
from typing import List, Optional

class ExistingGrievance(BaseModel):
    id: str = Field(..., description="UUID or identifier of the existing grievance")
    title: str = Field(..., description="Title of the existing grievance")
    description: str = Field(..., description="Detailed description of the existing grievance")

class GrievanceAnalysisRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=300, description="Title of the complaint")
    description: str = Field(..., min_length=5, max_length=5000, description="Full description of the complaint")
    location: Optional[str] = Field(None, max_length=255, description="Geographic location or landmark")
    existingGrievances: Optional[List[ExistingGrievance]] = Field(
        default=[],
        description="List of candidate grievances to check for semantic similarity"
    )

class SimilarityResult(BaseModel):
    targetGrievanceId: str
    similarityScore: float
    isPotentialDuplicate: bool

class GrievanceAnalysisResponse(BaseModel):
    predictedCategory: str
    categoryConfidence: float
    severityScore: float
    predictedPriority: str
    isAnomalous: bool
    anomalyReason: Optional[str] = None
    similarities: List[SimilarityResult] = []
    modelVersion: str = "scikit-tfidf-v1.0.0"

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    environment: str
