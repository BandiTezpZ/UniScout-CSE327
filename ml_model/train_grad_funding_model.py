import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# -----------------------------
# Configuration
# -----------------------------
np.random.seed(42)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

N_SYNTHETIC_ROWS = 30000

# -----------------------------
# Helper functions
# -----------------------------
def generate_research_score():
    paper_weights = np.array([5, 4, 4, 3, 2, 1])  # A*, A, Q1, Q2, Q3, Q4
    paper_count = np.random.choice([0, 1, 2, 3, 4], p=[0.50, 0.25, 0.15, 0.07, 0.03])

    if paper_count == 0:
        return 0

    papers = np.random.choice(paper_weights, size=paper_count, replace=True)
    return int(papers.sum())


def categorize_funding(score):
    if score >= 75:
        return "High"
    if score >= 55:
        return "Medium"
    return "Low"


# -----------------------------
# Generate synthetic funding cases
# -----------------------------
rows = []

for _ in range(N_SYNTHETIC_ROWS):
    cgpa = round(np.random.uniform(2.5, 4.0), 2)
    gre = np.random.randint(280, 341)
    research_score = generate_research_score()

    # Normalize to 0-100 ranges
    cgpa_component = ((cgpa - 2.5) / (4.0 - 2.5)) * 100
    gre_component = ((gre - 280) / (340 - 280)) * 100
    research_component = min((research_score / 15) * 100, 100)

    # Funding logic: paper quality + CGPA + GRE
    funding_score = (
        0.45 * cgpa_component
        + 0.30 * gre_component
        + 0.25 * research_component
    )

    funding_category = categorize_funding(funding_score)

    rows.append({
        "cgpa": cgpa,
        "gre": gre,
        "research_score": research_score,
        "funding_category": funding_category
    })

df = pd.DataFrame(rows)

FEATURE_COLUMNS = ["cgpa", "gre", "research_score"]

X = df[FEATURE_COLUMNS]
y = df["funding_category"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = LogisticRegression(max_iter=2000, class_weight="balanced")

model.fit(X_train_scaled, y_train)

pred = model.predict(X_test_scaled)

print("=" * 60)
print("GRAD FUNDING MODEL TRAINING COMPLETE")
print("=" * 60)
print(f"Training Rows: {len(df)}")
print(f"Accuracy     : {accuracy_score(y_test, pred):.4f}")
print()
print("Class Distribution:")
print(y.value_counts())
print()
print("Classification Report:")
print(classification_report(y_test, pred))
print()
print("Confusion Matrix:")
print(confusion_matrix(y_test, pred, labels=["High", "Medium", "Low"]))

joblib.dump(model, MODEL_DIR / "grad_funding_model.pkl")
joblib.dump(scaler, MODEL_DIR / "grad_funding_scaler.pkl")
joblib.dump(FEATURE_COLUMNS, MODEL_DIR / "grad_funding_feature_columns.pkl")

print("\nGrad Funding Model Saved Successfully.")
print("Grad Funding Scaler Saved Successfully.")
print("Grad Funding Feature Columns Saved Successfully.")