# AICTE Complaint Monitoring Dashboard — Progress

## Project decisions
- Backend: FastAPI
- Language: Python
- Frontend: HTML, CSS, JavaScript
- Database: SQLite
- ORM: SQLAlchemy 2.1
- Data: Synthetic demonstration data
- Development: Windows local environment

## Completed

### Step 1 — Environment and starter application
- [x] Python and Git verified
- [x] Virtual environment created
- [x] FastAPI and Uvicorn installed
- [x] Frontend served successfully
- [x] Backend health endpoint verified
- [x] Initial Git commit created

### Step 2 — Database and seed data
- [ ] SQLAlchemy installed
- [ ] Database connection configured
- [ ] Institution model created
- [ ] Complaint model created
- [ ] Audit log model created
- [ ] Synthetic seed data inserted
- [ ] Database contents verified

## Next
Step 3 — Generate a larger synthetic dataset with
ground-truth labels and institution name variations.
### Step 3 — Synthetic dataset
- [x] Ten synthetic institution records generated
- [x] Ten synthetic complaints generated
- [x] Four positive ground-truth pairs created
- [x] One negative ground-truth pair created
- [x] Ground-truth JSON exported
- [x] Duplicate generation prevented

### Step 4 — CSV ingestion
- [x] CSV reader and required-field validation
- [x] Basic institution name normalization
- [x] Permanent ID matching priority
- [x] Exact identity matching fallback
- [x] Duplicate case-number protection
- [x] Audit entries for imported complaints
- [x] Sample CSV created

### Step 5 — Institution resolver
- [x] Permanent ID matching
- [x] Institution name normalization
- [x] Exact identity matching
- [x] Conservative fuzzy matching
- [x] Location evidence checks
- [x] Candidate margin checks
- [x] Human-review requirement
- [x] Five resolver tests

### Step 6 — Cross-bureau overlap detection
- [x] Group complaints by institution record
- [x] Ignore closed/resolved complaints
- [x] Detect active cases across different bureaus
- [x] Normalize bureau names before comparison
- [x] Generate explainable overlap signals
- [x] Require human review
- [x] Six overlap detection tests

### Step 7 — SLA monitoring and matching evaluation
- [x] Closed complaint detection
- [x] Missing deadline handling
- [x] Overdue complaint detection
- [x] Due-soon alerts (48-hour window)
- [x] On-track complaint detection
- [x] Precision calculation
- [x] Recall calculation
- [x] F1-score calculation
- [x] Eight SLA and evaluation tests
### Step 9.2 — Integrated institution and complaint matching
- [x] Compare separate institution records
- [x] Normalize institution names
- [x] Use district, state and PIN code evidence
- [x] Compare complaint subjects as supporting evidence
- [x] Generate explainable potential overlap signals
- [x] Use PROBABLE and POSSIBLE confidence levels
- [x] Require human review
- [x] Seven overlap tests

### Step 9.3 — Case and institution detail APIs
- [x] Institution listing endpoint
- [x] Institution profile endpoint
- [x] Individual complaint detail endpoint
- [x] Complaint audit history in detail response
- [x] Complaint and institution data serialization
- [x] Not-found responses