from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import numpy as np

# Exact civic categories
CATEGORIES = [
    "Roads & Transport Infrastructure",
    "Water Supply & Sanitation",
    "Waste Management & Cleanliness",
    "Electricity & Power Distribution",
    "Public Safety & Civic Nuisance"
]

# Local training dataset containing realistic civic complaint examples
TRAINING_DATA = [
    # Roads & Transport Infrastructure
    ("Severe deep pothole on main road causing vehicle accidents and traffic jam", "Roads & Transport Infrastructure"),
    ("Broken concrete pavement and damaged footpath for pedestrians near railway station", "Roads & Transport Infrastructure"),
    ("Streetlights not working on highway causing complete dark stretch at night", "Roads & Transport Infrastructure"),
    ("Traffic signal failed at busy four-way intersection causing collisions", "Roads & Transport Infrastructure"),
    ("Road caving in after monsoon rains near flyover pillar", "Roads & Transport Infrastructure"),
    ("Speed breaker unpainted and without warning signs causing bike crashes", "Roads & Transport Infrastructure"),
    ("Unfinished road repair work left open with gravel and stones scattered", "Roads & Transport Infrastructure"),
    ("Manhole cover broken on road lane causing risk of tyre puncture and falls", "Roads & Transport Infrastructure"),

    # Water Supply & Sanitation
    ("Drinking water pipeline burst and flooding residential colony street", "Water Supply & Sanitation"),
    ("Contaminated dirty brown water coming from taps with severe sewage foul smell", "Water Supply & Sanitation"),
    ("No municipal water supply in our locality for the past five consecutive days", "Water Supply & Sanitation"),
    ("Underground sewage pipe leaking into open gutter causing overflow", "Water Supply & Sanitation"),
    ("Low water pressure in municipal pipeline unable to fill overhead tanks", "Water Supply & Sanitation"),
    ("Blocked sewage line causing toilet backflow in ground floor apartments", "Water Supply & Sanitation"),
    ("Public drinking water borewell tap is leaking continuously wasting water", "Water Supply & Sanitation"),
    ("Drainage inspection chamber clogged with silt and overflowing onto pavement", "Water Supply & Sanitation"),

    # Waste Management & Cleanliness
    ("Large pile of garbage dumped on roadside not collected for a week", "Waste Management & Cleanliness"),
    ("Municipal waste collection truck has stopped visiting our residential ward", "Waste Management & Cleanliness"),
    ("Stray cattle and dogs feeding on overflowing garbage bin near primary school", "Waste Management & Cleanliness"),
    ("Illegal commercial debris and plastic waste dumped in vacant government plot", "Waste Management & Cleanliness"),
    ("Dead animal carcass lying near market entrance causing extreme foul stench", "Waste Management & Cleanliness"),
    ("Public trash containers broken and rotting trash spilling onto walking street", "Waste Management & Cleanliness"),
    ("Open dumping of hazardous construction waste and broken glass along alley", "Waste Management & Cleanliness"),
    ("Compost bin at community park overflowing and attracting rodents and flies", "Waste Management & Cleanliness"),

    # Electricity & Power Distribution
    ("High voltage power transformer sparking with loud explosive sound", "Electricity & Power Distribution"),
    ("Exposed live electrical cable dangling low over school pedestrian sidewalk", "Electricity & Power Distribution"),
    ("Frequent unscheduled power cuts and voltage fluctuations damaging home appliances", "Electricity & Power Distribution"),
    ("Electric utility pole leaning dangerously over house after storm winds", "Electricity & Power Distribution"),
    ("Distribution box left unlocked with exposed bare wires accessible to children", "Electricity & Power Distribution"),
    ("Substation failure causing complete blackout across residential sectors", "Electricity & Power Distribution"),
    ("Phase failure resulting in low voltage and humming sounds in meters", "Electricity & Power Distribution"),
    ("Overhead power lines sagging dangerously close to residential balconies", "Electricity & Power Distribution"),

    # Public Safety & Civic Nuisance
    ("Aggressive pack of stray dogs attacking schoolchildren and bikers", "Public Safety & Civic Nuisance"),
    ("Illegal loudspeaker playing blaring music past midnight violating noise regulations", "Public Safety & Civic Nuisance"),
    ("Dilapidated abandoned building wall about to collapse on public pathway", "Public Safety & Civic Nuisance"),
    ("Unauthorized industrial chemical fumes releasing into residential neighborhood", "Public Safety & Civic Nuisance"),
    ("Encroachment of pedestrian sidewalk by illegal shop extensions blocking egress", "Public Safety & Civic Nuisance"),
    ("Broken railing on public pedestrian bridge over river causing falling risk", "Public Safety & Civic Nuisance"),
    ("Drunkards gathering at dark public park corner harassing evening commuters", "Public Safety & Civic Nuisance"),
    ("Illegal storage of explosive firecrackers in dense residential basement", "Public Safety & Civic Nuisance")
]

class GrievanceClassifier:
    def __init__(self):
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words='english',
                sublinear_tf=True,
                min_df=1
            )),
            ('clf', LogisticRegression(
                C=1.0,
                max_iter=300,
                random_state=42,
                solver='lbfgs'
            ))
        ])
        self._train()

    def _train(self):
        texts, labels = zip(*TRAINING_DATA)
        self.pipeline.fit(texts, labels)

    def predict(self, text: str) -> tuple[str, float]:
        """
        Classifies complaint text into one of the 5 civic categories.
        Returns: (predictedCategory, categoryConfidence)
        """
        if not text or not text.strip():
            return (CATEGORIES[0], 0.20)

        cleaned_text = text.strip()
        probabilities = self.pipeline.predict_proba([cleaned_text])[0]
        max_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[max_idx])
        predicted_category = self.pipeline.classes_[max_idx]

        return (predicted_category, round(confidence, 4))

# Singleton instance
classifier = GrievanceClassifier()
