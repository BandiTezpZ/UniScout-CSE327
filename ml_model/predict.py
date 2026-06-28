import joblib
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"


# -----------------------------
# Utility Functions
# -----------------------------
def get_float(prompt):
    while True:
        try:
            return float(input(prompt))
        except ValueError:
            print("Please enter a valid number.")


def get_int(prompt):
    while True:
        try:
            return int(input(prompt))
        except ValueError:
            print("Please enter a valid integer.")


def load_feature_columns(filename):
    path = MODEL_DIR / filename

    if path.suffix == ".pkl":
        return joblib.load(path)

    with open(path, "r") as f:
        return [line.strip() for line in f.readlines() if line.strip()]


def find_feature_file(possible_names):
    for name in possible_names:
        if (MODEL_DIR / name).exists():
            return name
    raise FileNotFoundError(f"None of these feature files found: {possible_names}")


# -----------------------------
# Research Score
# -----------------------------
def calculate_research_score():
    answer = input("Do you have research papers? (yes/no): ").strip().lower()

    if answer not in ["yes", "y"]:
        return 0

    paper_count = get_int("How many research papers do you have? ")

    paper_weights = {
        "A*": 5,
        "A": 4,
        "B": 3,
        "C": 2,
        "Q1": 4,
        "Q2": 3,
        "Q3": 2,
        "Q4": 1,
        "OTHER": 1,
    }

    print("\nAvailable paper categories:")
    print("A*, A, B, C, Q1, Q2, Q3, Q4, Other")

    total_score = 0

    for i in range(1, paper_count + 1):
        while True:
            category = input(f"Paper {i} category: ").strip().upper()

            if category in paper_weights:
                total_score += paper_weights[category]
                break
            else:
                print("Invalid category. Use A*, A, B, C, Q1, Q2, Q3, Q4, or Other.")

    return total_score


# -----------------------------
# Feature Builders
# -----------------------------
def build_ug_features(student, uni):
    return {
        "high_school_gpa": student["gpa"],
        "ielts": student["ielts"],
        "sat": student["sat"],

        "gpa_fit": requirement_fit(student["gpa"], uni["min_gpa"], 0.30, 0.80),
        "ielts_fit": requirement_fit(student["ielts"], uni["min_ielts"], 0.50, 1.50),
        "test_fit": requirement_fit(student["sat"], uni["min_sat"], 120, 300),

        "gpa_gap": student["gpa"] - uni["min_gpa"],
        "ielts_gap": student["ielts"] - uni["min_ielts"],
        "test_score_gap": student["sat"] - uni["min_sat"],

        "rank_tier": uni["rank_tier"],
        "min_gpa": uni["min_gpa"],
        "min_ielts": uni["min_ielts"],
        "min_sat": uni["min_sat"],
    }


def build_grad_features(student, uni):
    return {
        "cgpa": student["cgpa"],
        "ielts": student["ielts"],
        "gre": student["gre"],
        "research_score": student["research_score"],

        "cgpa_fit": requirement_fit(student["cgpa"], uni["min_cgpa"], 0.30, 0.80),
        "ielts_fit": requirement_fit(student["ielts"], uni["min_ielts"], 0.50, 1.50),
        "test_fit": requirement_fit(student["gre"], uni["min_gre"], 8, 20),

        "cgpa_gap": student["cgpa"] - uni["min_cgpa"],
        "ielts_gap": student["ielts"] - uni["min_ielts"],
        "test_score_gap": student["gre"] - uni["min_gre"],

        "rank_tier": uni["rank_tier"],
        "min_cgpa": uni["min_cgpa"],
        "min_ielts": uni["min_ielts"],
        "min_gre": uni["min_gre"],
        "research_level": uni["research_level"],
    }


def requirement_fit(value, required, tolerance, max_shortfall):
    gap = value - required

    if gap >= 0:
        return 100
    if gap >= -tolerance:
        return 70
    if gap >= -max_shortfall:
        return 40
    return 0


# -----------------------------
# Recommendation Engine
# -----------------------------
def recommend_universities(level):
    if level == "ug":
        data = pd.read_csv(DATA_DIR / "ug_university_data.csv")

        model = joblib.load(MODEL_DIR / "ug_admission_model.pkl")
        scaler = joblib.load(MODEL_DIR / "ug_scaler.pkl")

        feature_file = find_feature_file([
            "ug_feature_columns.pkl",
            "ug_feature_columns.txt",
        ])
        feature_columns = load_feature_columns(feature_file)

        print("\nEnter Undergraduate Student Profile")
        student = {
            "gpa": get_float("High School GPA (4.0 scale): "),
            "ielts": get_float("IELTS: "),
            "sat": get_float("SAT: "),
        }

        build_features = build_ug_features

    else:
        data = pd.read_csv(DATA_DIR / "grad_university_data.csv")

        model = joblib.load(MODEL_DIR / "grad_admission_model.pkl")
        scaler = joblib.load(MODEL_DIR / "grad_scaler.pkl")

        feature_file = find_feature_file([
            "grad_feature_columns.pkl",
            "grad_feature_columns.txt",
        ])
        feature_columns = load_feature_columns(feature_file)

        print("\nEnter Graduate Student Profile")
        student = {
            "cgpa": get_float("CGPA (4.0 scale): "),
            "ielts": get_float("IELTS: "),
            "gre": get_float("GRE: "),
        }

        student["research_score"] = calculate_research_score()

        build_features = build_grad_features

    results = []

    for _, uni in data.iterrows():
        features = build_features(student, uni)

        X = pd.DataFrame([features])

        for col in feature_columns:
            if col not in X.columns:
                X[col] = 0

        X = X[feature_columns]
        X_scaled = scaler.transform(X)

        category = model.predict(X_scaled)[0]

        probability = max(model.predict_proba(X_scaled)[0])

        results.append({
            "university_name": uni["university_name"],
            "country": uni["country"],
            "state": uni["state"],
            "program": uni["program"],
            "cost_of_attendance": uni["cost_of_attendance_usd"],
            "category": category,
            "internal_rank_score": probability,
        })

    results_df = pd.DataFrame(results)

    print("\n====================================")
    print("        UniScout Suggestions")
    print("====================================")

    for category in ["Safe", "Target", "Reach"]:
        subset = results_df[results_df["category"] == category]
        subset = subset.sort_values(by="internal_rank_score", ascending=False).head(3)

        print(f"\n{category.upper()} UNIVERSITIES")
        print("-" * 35)

        if subset.empty:
            print("No suitable universities found in this category.")
        else:
            for i, row in enumerate(subset.itertuples(), start=1):
                print(
                    f"{i}. {row.university_name} "
                    f"({row.state}, {row.country}) - "
                    f"{row.program} | "
                    f"COA: ${int(row.cost_of_attendance):,}"
                )

    if level == "grad":
        show_grad_funding(student)
    else:
        print("\n====================================")
        print("Funding Competitiveness: Not estimated for undergraduate applicants.")
        print("====================================")


# -----------------------------
# Funding Model
# -----------------------------
def show_grad_funding(student):
    funding_model = joblib.load(MODEL_DIR / "grad_funding_model.pkl")
    funding_scaler = joblib.load(MODEL_DIR / "grad_funding_scaler.pkl")

    feature_file = find_feature_file([
        "grad_funding_feature_columns.pkl",
        "grad_funding_feature_columns.txt",
    ])
    funding_columns = load_feature_columns(feature_file)

    funding_features = pd.DataFrame([{
        "cgpa": student["cgpa"],
        "gre": student["gre"],
        "research_score": student["research_score"],
    }])

    for col in funding_columns:
        if col not in funding_features.columns:
            funding_features[col] = 0

    funding_features = funding_features[funding_columns]
    funding_scaled = funding_scaler.transform(funding_features)

    funding_prediction = funding_model.predict(funding_scaled)[0]

    print("\n====================================")
    print(f"Funding Competitiveness: {funding_prediction}")
    print("====================================")


# -----------------------------
# Main Menu
# -----------------------------
def main():
    print("====================================")
    print("          UniScout Predictor")
    print("====================================")
    print("1. Undergraduate Recommendations")
    print("2. Graduate Recommendations")

    choice = input("\nChoose option: ").strip()

    if choice == "1":
        recommend_universities("ug")
    elif choice == "2":
        recommend_universities("grad")
    else:
        print("Invalid choice.")


if __name__ == "__main__":
    main()