# UniScout 1.8

UniScout is a React/Vite and Express university discovery demo. It supports Student, Faculty, and Admin portals, CV-to-profile parsing, local university browsing/shortlisting, Gemini-powered local catalogue analysis, recommendation-letter requests, and admin database management.

## Requirements

- Node.js 18+
- npm
- Optional: MySQL/XAMPP
- Optional: Gemini API key for the AI University Finder

## Installation

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Or run both with:

```bat
run-uniscout.bat
```

## Environment

Copy `backend/.env.example` to `backend/.env` and set values as needed.

Important variables:

- `PORT`
- `JWT_SECRET`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_SECURE`
- `GEMINI_API_KEY`
- `GEMINI_API_KEYS` (optional comma-separated key pool; preferred when multiple keys are configured)
- `GEMINI_MODEL`
- `AI_RECOMMENDATION_CACHE_HOURS`

Do not commit or share real SMTP/API secrets.

## Database Behavior

UniScout attempts MySQL first. If MySQL is unavailable, the backend keeps running and automatically uses JSON fallback files from `backend/data`.

JSON fallback supports the demo workflow: users, login, verification data, student/faculty profiles, universities, search/sort, shortlists, AI catalogue shortlists, recommendation requests, recommendation-letter metadata, admin user management, and admin university CRUD.

## Discovery Behavior

UniScout now has two complementary discovery paths.

Browse Universities is a local catalogue. It searches, filters, sorts, shortlists, and lets Admin users add, update, or delete university records from the local database or JSON fallback.

Suggested Universities sends factual profile/CV information and a compact copy of the local university catalogue to Gemini. Gemini chooses relevant catalogue records and explains why they may be worth investigating. Google Search grounding is not used, so this mode works with eligible free-tier Gemini API quotas.

The AI University Finder does not show match percentages, admission probabilities, Safe/Target/Reach labels, or profile strength scores. It returns program names, reasons, requirements, funding notes, things to verify, and source links.

UniScout validates Gemini's selected catalogue IDs and rebuilds displayed university facts from the local database. Successful results are cached for the configured period when the profile and catalogue have not changed. If Gemini is unavailable, quota-limited, offline, missing an API key, or returns invalid JSON, UniScout shows a friendly unavailable message and does not generate fake fallback recommendations. Students can still browse and shortlist universities manually.

AI catalogue recommendations can be saved to Shortlisted alongside manually browsed universities.

CV parsing stores factual profile details such as degree, major, CGPA, tests, budget, skills, research interests, and publication lines. Publication titles, venue hints, years, and authorship are preserved when the CV text contains them.

## Demo Accounts

Current local JSON demo accounts:

- Student: `student1@example.com` / `1234`
- Admin: `admin@example.com` / `1234`
- Faculty: `faculty1@example.com` / `123456`

## Verification

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run build
```

## Demo Checklist

1. Start backend and frontend with `run-uniscout.bat`.
2. Login as Student.
3. Open Profile Info and confirm profile values.
4. Open Suggested Universities.
5. Click Find Universities and confirm the engine evaluates the complete local university catalogue.
6. Confirm exactly one Reach, Target, and Safety result appears when at least three credible universities exist.
7. When Gemini keys are configured, confirm explanation requests rotate between available keys and quota failures fall back to the local engine.
8. Shortlist a local or AI catalogue university.
9. Open Shortlisted and confirm it appears.
10. Create or inspect a recommendation request.
11. Login as Faculty and accept/decline/upload a recommendation PDF.
12. Login as Admin and edit users or the university database.

## Notes

This is a course/demo project. Passwords are intentionally stored in plaintext for the local XAMPP/demo requirement. Production security hardening should be done before any public deployment.

Scanned-image PDFs still need OCR and may not parse. Applications are marked Coming Soon so the demo does not present a half-built tracker as finished.
