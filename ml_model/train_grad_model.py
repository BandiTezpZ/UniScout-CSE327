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
DATA_PATH = BASE_DIR / "data" / "grad_university_data.csv"
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


def gre_fit(score, required, accepts_without_gre):
    if str(accepts_without_gre).strip().lower() == "yes":
        # The university does not require GRE, so we do not punish the student.
        return 80
    return requirement_fit(score, required, tolerance=8, max_shortfall=18)


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

    # Master's applicants are more likely than UG applicants to have publications.
    paper_count = np.random.choice([0, 1, 2, 3, 4], p=[0.50, 0.25, 0.15, 0.07, 0.03])

    if paper_count == 0:
        return 0

    papers = np.random.choice(paper_weights, size=paper_count, replace=True)
    return int(papers.sum())


# -----------------------------
# Load universities
# -----------------------------
universities = pd.read_csv(DATA_PATH)

# Keep cost for display, not as an ML feature.
if "cost_of_attendance_usd" not in universities.columns:
    universities["cost_of_attendance_usd"] = universities["tuition_usd"] + universities["living_cost_usd"]

rows = []

# -----------------------------
# Generate synthetic applicants
# -----------------------------
for _ in range(N_SYNTHETIC_ROWS):
    student = {
        "cgpa": round(np.random.uniform(2.5, 4.0), 2),
        "ielts": round(np.random.uniform(5.5, 9.0), 1),
        "gre": np.random.randint(280, 341),
        "research_score": generate_research_score(),
    }

    uni = universities.sample(1).iloc[0]

    # -----------------------------
    # Engineered comparison features
    # -----------------------------
    cgpa_gap = student["cgpa"] - uni["min_cgpa"]
    ielts_gap = student["ielts"] - uni["min_ielts"]
    gre_gap = student["gre"] - uni["min_gre"]

    cgpa_fit = requirement_fit(student["cgpa"], uni["min_cgpa"], tolerance=0.20, max_shortfall=0.50)
    ielts_fit = requirement_fit(student["ielts"], uni["min_ielts"], tolerance=0.50, max_shortfall=1.00)
    gre_fit_score = gre_fit(student["gre"], uni["min_gre"], uni["accepts_without_gre"])

    # Higher-ranked / more selective universities require stronger applicant profiles.
    difficulty = 6 - int(uni["rank_tier"])  # rank_tier 1 => difficulty 5
    difficulty_penalty = difficulty * 4

    # Research matters more for Master's than UG.
    research_bonus = min(student["research_score"] * 2.5, 20)
    research_alignment_bonus = min(student["research_score"] * float(uni["research_level"]) * 0.8, 15)

    final_score = (
        0.35 * cgpa_fit
        + 0.20 * ielts_fit
        + 0.25 * gre_fit_score
        + research_bonus
        + research_alignment_bonus
        - difficulty_penalty
    )

    final_score = max(0, min(100, final_score))
    admission_category = categorize_admission(final_score)

    rows.append({
        # Raw student features
        "cgpa": student["cgpa"],
        "ielts": student["ielts"],
        "gre": student["gre"],
        "research_score": student["research_score"],

        # Engineered fit features
        "cgpa_gap": cgpa_gap,
        "ielts_gap": ielts_gap,
        "test_score_gap": gre_gap,

        # University features
        "rank_tier": uni["rank_tier"],
        "min_cgpa": uni["min_cgpa"],
        "min_ielts": uni["min_ielts"],
        "min_gre": uni["min_gre"],
        "research_level": uni["research_level"],

        # Target label
        "admission_category": admission_category
    })

# -----------------------------
# Training dataframe
# -----------------------------
df = pd.DataFrame(rows)

FEATURE_COLUMNS = [
    "cgpa",
    "ielts",
    "gre",
    "research_score",
    "cgpa_gap",
    "ielts_gap",
    "test_score_gap",
    "rank_tier",
    "min_cgpa",
    "min_ielts",
    "min_gre",
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

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = LogisticRegression(max_iter=2000, class_weight="balanced")

model.fit(X_train_scaled, y_train)

pred = model.predict(X_test_scaled)

print("=" * 60)
print("GRAD ADMISSION MODEL TRAINING COMPLETE")
print("=" * 60)
print(f"Universities : {len(universities)}")
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
print(confusion_matrix(y_test, pred, labels=["Safe", "Target", "Reach", "Not Recommended"]))

joblib.dump(model, MODEL_DIR / "grad_admission_model.pkl")
joblib.dump(scaler, MODEL_DIR / "grad_scaler.pkl")
joblib.dump(FEATURE_COLUMNS, MODEL_DIR / "grad_feature_columns.pkl")

print("\nGrad Admission Model Saved Successfully.")
print("Grad Scaler Saved Successfully.")
print("Grad Feature Columns Saved Successfully.")