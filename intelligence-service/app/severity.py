import re

# Keywords indicating immediate danger, life safety risks, or severe bodily harm
DANGER_KEYWORDS = [
    "fatal", "death", "die", "casualty", "injury", "injured", "hospital",
    "collapse", "collapsing", "spark", "sparking", "explosion", "exploding",
    "electrocution", "shock", "fire", "sinkhole", "hazard", "life-threatening",
    "drowning", "accident", "bleeding", "poison", "toxic", "gas leak"
]

# Keywords indicating disruption of vital/essential municipal services
ESSENTIAL_DISRUPTION_KEYWORDS = [
    "no water", "drinking water", "blackout", "no power", "no electricity",
    "pipeline burst", "pipeline rupture", "sewage overflow", "contamination",
    "contaminated", "foul smell", "epidemic", "dengue", "cholera", "malaria",
    "impassable", "submerged", "flooding", "blocked entrance"
]

# Keywords indicating wide scale or community-wide impact
SCALE_KEYWORDS = [
    "entire neighborhood", "all residents", "colony", "ward", "sector",
    "community", "thousands", "hundreds", "primary school", "hospital",
    "children", "elderly", "pedestrians", "commuters", "public"
]

# Keywords indicating duration, neglect, or high urgency
DURATION_URGENCY_KEYWORDS = [
    "urgent", "immediately", "emergency", "crisis", "critical",
    "weeks", "months", "persistent", "unattended", "repeatedly",
    "since days", "five days", "several days", "prolonged"
]

def analyze_severity_and_priority(title: str, description: str) -> tuple[float, str]:
    """
    Computes a deterministic, explainable severity score (0.05 to 1.0)
    and maps it to an advisory priority tier: LOW, MEDIUM, HIGH, CRITICAL.

    Evaluation formula:
      Base Score: 0.20 (standard minor civic issue)
      + Danger Score: +0.35 if immediate danger/safety keywords matched
      + Disruption Score: +0.25 if essential public service disrupted
      + Scale Score: +0.15 if community-wide or vulnerable population affected
      + Urgency Score: +0.10 if high duration/urgency keywords matched
    """
    combined_text = f"{title} {description}".lower()

    score = 0.20  # Base civic grievance weight

    # Factor 1: Immediate Danger / Safety Risk
    danger_matches = [w for w in DANGER_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', combined_text)]
    if danger_matches:
        score += min(0.35, 0.20 + (len(danger_matches) * 0.05))

    # Factor 2: Disruption of Essential Public Services
    disruption_matches = [w for w in ESSENTIAL_DISRUPTION_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', combined_text)]
    if disruption_matches:
        score += min(0.25, 0.15 + (len(disruption_matches) * 0.05))

    # Factor 3: Scale of Population Affected
    scale_matches = [w for w in SCALE_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', combined_text)]
    if scale_matches:
        score += min(0.15, 0.10 + (len(scale_matches) * 0.03))

    # Factor 4: Persistence or Urgency
    urgency_matches = [w for w in DURATION_URGENCY_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', combined_text)]
    if urgency_matches:
        score += min(0.10, 0.05 + (len(urgency_matches) * 0.03))

    # Clamp score to [0.05, 1.00]
    final_score = round(max(0.05, min(1.0, score)), 2)

    # Priority mapping
    if final_score >= 0.80:
        predicted_priority = "CRITICAL"
    elif final_score >= 0.55:
        predicted_priority = "HIGH"
    elif final_score >= 0.35:
        predicted_priority = "MEDIUM"
    else:
        predicted_priority = "LOW"

    return final_score, predicted_priority
