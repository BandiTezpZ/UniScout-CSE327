# UniScout Update 1.3

This update completes the CV parsing-to-dashboard workflow.

## Changes

- Removed the filename-based test shortcut. The sample resume is now parsed
  from its actual PDF text.
- Extracts CGPA, IELTS/TOEFL, GRE/SAT/GMAT, degree level, intended major,
  publications, projects, internships, extracurricular activities, and skills.
- Missing values remain empty instead of being replaced with fabricated
  applicant information.
- Added PDF signature validation in addition to extension and MIME checks.
- Added clear feedback for scanned PDFs that contain no selectable text.
- Added frontend validation for the 10 MB upload limit.
- Updated the dashboard to show "Not detected" for missing fields.
- Renamed the progress panel from AI Analysis to CV Parsing.
- Kept the existing editable Profile Info form for correcting parsed results.
- Fixed invalid JSX in the Research Papers/Profile form area.

## Run

Install dependencies once in both application folders:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Start the backend and frontend in separate terminals:

```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

The frontend expects the API at `http://localhost:5001/api`.

## Current parser limitation

Version 1.3 handles text-based PDF documents. Scanned-image PDFs require an
OCR feature, which is outside this milestone.
