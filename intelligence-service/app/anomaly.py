import re
from typing import Optional

# Regular expressions detecting commercial spam, lottery scams, and financial solicitations
SPAM_PATTERNS = [
    r'\b(lottery|jackpot|cash\s*prize|win\s*\d+|reward\s*money|voucher)\b',
    r'\b(claim\s*(now|immediately|cash|prize)|urgent\s*notice\s*call)\b',
    r'\b(casino|betting|crypto|forex|instant\s*loan|credit\s*card\s*offer)\b',
    r'\b(click\s*(here|link)|visit\s*http|free\s*gift)\b',
    r'(\+?\d{10,12}|\b\d{10}\b)'  # Standalone phone numbers in suspicious spam context
]

def detect_anomaly(title: str, description: str) -> tuple[bool, Optional[str]]:
    """
    Lightweight heuristic anomaly detector for civic complaints.
    
    Identifies common quality issues and suspicious patterns:
      1. Very short text (< 15 characters total)
      2. Excessive single-word or character repetition
      3. Commercial / lottery / phishing spam keywords
      4. Excessive non-alphanumeric noise or gibberish
    
    Returns: (is_anomalous, anomaly_reason)
    """
    combined = f"{title} {description}".strip()
    clean_lower = combined.lower()

    # Signal 1: Extremely short text
    if len(combined) < 15:
        return True, "Complaint text is excessively short or lacks sufficient detail for civic processing."

    # Signal 2: Excessive repeated characters (e.g., 'aaaaaa', '!!!!!!')
    if re.search(r'(.)\1{5,}', combined):
        return True, "Excessive character repetition detected."

    # Signal 3: Excessive repeated words (e.g., 'help help help help help')
    words = re.findall(r'\b\w+\b', clean_lower)
    if words:
        word_counts = {}
        for w in words:
            word_counts[w] = word_counts.get(w, 0) + 1
        most_common_count = max(word_counts.values())
        if len(words) >= 5 and (most_common_count / len(words)) > 0.45:
            return True, "Excessive word repetition detected."

    # Signal 4: Commercial spam and promotional solicitation
    spam_match_count = 0
    matched_reasons = []
    for pattern in SPAM_PATTERNS:
        match = re.search(pattern, clean_lower)
        if match:
            spam_match_count += 1
            matched_reasons.append(match.group(0))

    if spam_match_count >= 2:
        return True, f"Spam/promotional solicitation pattern detected (triggers: {', '.join(matched_reasons[:2])})."

    # Signal 5: Keyboard mash / gibberish (words > 8 chars with no vowels)
    long_words = [w for w in words if len(w) > 8]
    for w in long_words:
        vowel_count = len(re.findall(r'[aeiou]', w))
        if vowel_count == 0:
            return True, "Unstructured text pattern or potential keyboard mash detected."

    return False, None
