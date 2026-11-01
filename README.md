# AICTE Integrated Institution Complaint Monitoring and Status Dashboard

Smart India Hackathon prototype. One dashboard that brings complaints from different AICTE bureaus (Regional Bureau, PGRC, Other Bureaus) into a single view, tracks their deadlines, and **suggests possible overlaps** where different bureaus are handling complaints about the same institution. Overlaps are suggestions only: a human officer reviews every pair and nothing is merged automatically.

> All data in this prototype is **synthetic demonstration data**.

## What it does

- **Unified complaint view:** search and filter complaints from all bureaus, with SLA status (on track, due soon, overdue, closed).
- **Overlap suggestions:** finds active complaints in different bureaus that concern the same institution, even when the institution is written differently (for example "Central Inst. of Technology" and "Central Institute of Technology"). Each suggestion lists its signals and an explanation.
- **Human review:** officers can confirm a link, request coordination, or dismiss (a reason is mandatory). Every decision is written to an append-only audit log.
- **Role-based access:** only bureau officers and admins can record decisions; management has read-only access.
- **Institution and complaint pages:** full detail with related complaints and audit history.
- **Evaluation page:** precision, recall and F1 of the overlap detector against a known answer key.
- **Reports:** Excel and PDF export of complaints and overlaps.
- **CSV ingestion:** bulk import with duplicate protection and audit entries.

## How overlap detection works

1. Consider only complaints that are still active.
2. Compare only complaints handled by different bureaus.
3. Compare their institutions: names are normalised (abbreviations like "Inst." and "Engg." are expanded) and scored for similarity. Name similarity alone never creates an overlap, so the state and either the district or PIN code must also match.
4. Name similarity of 90% or more is labelled PROBABLE, 65% to 90% is POSSIBLE.
5. Complaint subject similarity is shown as supporting evidence. It does not decide whether an overlap is reported.
6. Every suggestion requires human review.

## Tech stack

Backend: Python, FastAPI, SQLAlchemy, SQLite.
Frontend: React, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts, jsPDF, SheetJS.

## Run it locally (Windows)

Backend, from the project folder:

```
python -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
python -m app.seed
python -m app.synthetic_data
python -m app.ingestion
python -m uvicorn app.main:app --reload
```

Frontend, in a second terminal:

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. API documentation is at http://127.0.0.1:8000/docs.

Demo accounts (password `demo123`): `admin`, `rb_officer`, `pgrc_officer`, `management`.

Tests: `python -m pip install pytest` then `python -m pytest -v`.

## Main API endpoints

All endpoints except login need `Authorization: Bearer <token>`.

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` | Sign in and get a token |
| `GET /api/dashboard/summary` | Headline numbers |
| `GET /api/complaints`, `/api/complaints/{case_number}` | Complaint list and detail |
| `GET /api/institutions`, `/api/institutions/{id}` | Institution list and detail |
| `GET /api/overlaps` | Suggested overlaps |
| `POST /api/overlaps/decision` | Record a human decision |
| `GET /api/audit` | Audit log |
| `GET /api/evaluation` | Precision, recall and F1 against the answer key |

## Project structure

```
app/        FastAPI backend (api, models, overlap, resolver, sla, ingestion, auth)
data/       SQLite database, sample CSV, ground-truth answer key
tests/      Backend tests
frontend/   React application
```

## Limitations

- Synthetic data only. The evaluation benchmark is small (4 true pairs, 1 look-alike pair) and made by the team, so it checks the logic, not real-world accuracy.
- Overlap detection works at institution level. Two complaints about different issues at the same institution can still be suggested, which is why officers review each pair.
- Decisions are stored as audit events, not as a status on the pair, so a reviewed pair still appears in the list (with its latest decision shown).
- Authentication is a demo token, not production security. The audit screen is hidden from some roles in the interface, but the API itself is available to any signed-in role.
- SQLite and pairwise comparison are fine for a prototype. A production version would need a proper database and candidate indexing to scale.
- The CSV import runs from the command line, not from the web interface.