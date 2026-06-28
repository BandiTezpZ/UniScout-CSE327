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
DATA_PATH = BASE_DIR / "data" / "ug_university_data.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

N_SYNTHETIC_ROWS = 30000

# -----------------------------
# Helper functions
# -----------------------------
def requirement_fit(value, required, tolerance, max_shortfall):
    """
    Returns a 0-100 fit score.
    100 = clearly meets requirement.
    70  = slightly below but still close.
    40  = weak.
    0   = far below requirement.
    """
    gap = value - required

    if gap >= 0:
        return 100
    if gap >= -tolerance:
        return 70
    if gap >= -max_shortfall:
        return 40
    return 0


def test_fit(score, required, accepts_without_test):
    if str(accepts_without_test).strip().lower() == "yes":
        # The university does not require the test, so we do not punish the student.
        return 80
    return requirement_fit(score, required, tolerance=80, max_shortfall=180)


def categorize_admission(score):
    if score >= 80:
        return "Safe"
    if score >= 65:
        return "Target"
    if score >= 50:
        return "Reach"
    return "Not Recommended"


def generate_research_score():
    """
    Simulates user-entered research paper categories.
    UI idea:
      - Ask if the student has papers.
      - If yes, ask count.
      - For each paper ask category: A*, A, Q1, Q2, Q3, Q4.
    The backend should convert those categories into one numeric research_score.
    """
    paper_weights = np.array([5, 4, 4, 3, 2, 1])  # A*, A, Q1, Q2, Q3, Q4

    # Most UG applicants have no publication; a few have one or more.
    paper_count = np.random.choice([0, 1, 2, 3], p=[0.75, 0.18, 0.06, 0.01])

    if paper_count == 0:
        return 0

    papers = np.random.choice(paper_weights, size=paper_count, replace=True)
    return int(papers.sum())


# -----------------------------
# Load University Dataset
# -----------------------------
universities = pd.read_csv(DATA_PATH)

# If cost_of_attendance_usd is missing, create it for display use.
if "cost_of_attendance_usd" not in universities.columns:
    universities["cost_of_attendance_usd"] = universities["tuition_usd"] + universities["living_cost_usd"]

# If research_level is missing from an older UG CSV, derive it from rank_tier.
# rank_tier: 1 = highest ranked, 5 = lowest ranked.
if "research_level" not in universities.columns:
    universities["research_level"] = (6 - universities["rank_tier"]).clip(1, 5)

rows = []

# -----------------------------
# Generate Synthetic Applicants
# -----------------------------
for _ in range(N_SYNTHETIC_ROWS):
    student = {
        "high_school_gpa": round(np.random.uniform(2.5, 4.0), 2),
        "ielts": round(np.random.uniform(5.5, 9.0), 1),
        "sat": np.random.randint(950, 1601),
        "research_score": generate_research_score(),
    }

    uni = universities.sample(1).iloc[0]

    # -----------------------------
    # Engineered comparison features
    # -----------------------------
    gpa_gap = student["high_school_gpa"] - uni["min_gpa"]
    ielts_gap = student["ielts"] - uni["min_ielts"]
    sat_gap = student["sat"] - uni["min_sat"]

    gpa_fit = requirement_fit(student["high_school_gpa"], uni["min_gpa"], tolerance=0.20, max_shortfall=0.50)
    ielts_fit = requirement_fit(student["ielts"], uni["min_ielts"], tolerance=0.50, max_shortfall=1.00)
    sat_fit_score = test_fit(student["sat"], uni["min_sat"], uni["accepts_without_sat"])

    # Higher-ranked / more selective universities require stronger applicant profiles.
    difficulty = 6 - int(uni["rank_tier"])  # rank_tier 1 => difficulty 5
    difficulty_penalty = difficulty * 4

    # Research is not the main driver for UG, but it can help for selective/research-heavy places.
    research_bonus = min(student["research_score"] * 1.5, 10)
    research_alignment_bonus = min(student["research_score"] * float(uni["research_level"]) * 0.5, 8)

    final_score = (
        0.40 * gpa_fit
        + 0.20 * ielts_fit
        + 0.25 * sat_fit_score
        + research_bonus
        + research_alignment_bonus
        - difficulty_penalty
    )

    final_score = max(0, min(100, final_score))
    admission_category = categorize_admission(final_score)

    rows.append({
        # Raw student features
        "high_school_gpa": student["high_school_gpa"],
        "ielts": student["ielts"],
        "sat": student["sat"],
        "research_score": student["research_score"],

        # Engineered fit features
        "gpa_gap": gpa_gap,
        "ielts_gap": ielts_gap,
        "test_score_gap": sat_gap,

        # University features
        "rank_tier": uni["rank_tier"],
        "min_gpa": uni["min_gpa"],
        "min_ielts": uni["min_ielts"],
        "min_sat": uni["min_sat"],
        "research_level": uni["research_level"],

        # Target label
        "admission_category": admission_category
    })

# -----------------------------
# Training Data
# -----------------------------
df = pd.DataFrame(rows)

FEATURE_COLUMNS = [
    "high_school_gpa",
    "ielts",
    "sat",
    "research_score",
    "gpa_gap",
    "ielts_gap",
    "test_score_gap",
    "rank_tier",
    "min_gpa",
    "min_ielts",
    "min_sat",
    "research_level",
]

X = df[FEATURE_COLUMNS]
y = df["admission_category"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

# -----------------------------
# Feature Scaling
# -----------------------------
scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# -----------------------------
# Multiclass Logistic Regression
# -----------------------------
model = LogisticRegression(max_iter=2000, class_weight="balanced")

model.fit(X_train_scaled, y_train)

predictions = model.predict(X_test_scaled)

# -----------------------------
# Results
# -----------------------------
print("=" * 60)
print("UNDERGRAD ADMISSION MODEL TRAINING COMPLETE")
print("=" * 60)
print(f"Universities Used : {len(universities)}")
print(f"Synthetic Rows    : {len(df)}")
print(f"Accuracy          : {accuracy_score(y_test, predictions):.4f}")
print()
print("Class Distribution:")
print(y.value_counts())
print()
print("Classification Report:")
print(classification_report(y_test, predictions))
print()
print("Confusion Matrix:")
print(confusion_matrix(y_test, predictions, labels=["Safe", "Target", "Reach", "Not Recommended"]))

# -----------------------------
# Save Model Assets
# -----------------------------
joblib.dump(model, MODEL_DIR / "ug_admission_model.pkl")
joblib.dump(scaler, MODEL_DIR / "ug_scaler.pkl")
joblib.dump(FEATURE_COLUMNS, MODEL_DIR / "ug_feature_columns.pkl")

print("\nUG Admission Model Saved Successfully.")
print("UG Scaler Saved Successfully.")
print("UG Feature Columns Saved Successfully.")