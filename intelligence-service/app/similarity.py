from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List
from app.schemas import ExistingGrievance, SimilarityResult

# Threshold above which a grievance is flagged as a potential duplicate
POTENTIAL_DUPLICATE_THRESHOLD = 0.60

def compute_grievance_similarity(
    current_title: str,
    current_description: str,
    existing_grievances: List[ExistingGrievance]
) -> List[SimilarityResult]:
    """
    Computes TF-IDF vector cosine similarity between the current complaint
    and a supplied list of existing complaints.

    Returns a list of SimilarityResult sorted in descending order of similarity score.
    """
    if not existing_grievances:
        return []

    current_text = f"{current_title} {current_description}".strip()
    candidate_texts = [f"{g.title} {g.description}".strip() for g in existing_grievances]

    # Combine corpus for TF-IDF fitting
    all_texts = [current_text] + candidate_texts

    try:
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 1),
            stop_words='english',
            min_df=1,
            sublinear_tf=True
        )
        tfidf_matrix = vectorizer.fit_transform(all_texts)

        # Vector of current complaint is at index 0, candidates are at 1..N
        current_vector = tfidf_matrix[0:1]
        candidate_vectors = tfidf_matrix[1:]

        # Compute cosine similarities between current and all candidate vectors
        similarities = cosine_similarity(current_vector, candidate_vectors)[0]

        results = []
        for idx, score in enumerate(similarities):
            float_score = round(float(score), 4)
            target = existing_grievances[idx]
            is_dup = float_score >= POTENTIAL_DUPLICATE_THRESHOLD

            results.append(SimilarityResult(
                targetGrievanceId=target.id,
                similarityScore=float_score,
                isPotentialDuplicate=is_dup
            ))

        # Sort descending by similarity score
        results.sort(key=lambda r: r.similarityScore, reverse=True)
        return results

    except Exception as e:
        # Fallback in case of unexpected text edge case
        print(f"[Similarity Error]: {e}")
        return []
