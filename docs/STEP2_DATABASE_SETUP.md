# Step 2 — Database Setup

## 1. PostgreSQL Installation

### Environment & Installation Status
- **Operating System**: Microsoft Windows 11 Home 64-bit (Build 10.0.26200)
- **Target PostgreSQL Version**: **PostgreSQL 16**
- **Automated Execution Outcome**:
  - Probing for existing PostgreSQL installations (`psql`, `postgres`) confirmed that PostgreSQL is not currently installed or on the system PATH.
  - An automated silent installation attempt using `winget install PostgreSQL.PostgreSQL.16 --silent` was initiated.
  - **Result**: The standard EnterpriseDB PostgreSQL installer for Windows (`postgresql-16.15-3-windows-x64.exe`, ~365 MB) requires **Windows Administrator privileges (UAC elevation)** to register the Windows service (`postgresql-x64-16`) and write to `C:\Program Files\PostgreSQL\16`. Because background processes cannot trigger interactive UAC elevation prompts, and because the installer requires an explicit administrative superuser password (`--superpassword <password>`), manual execution from an elevated terminal is required per protocol.

### Manual Action Required
Open **PowerShell as Administrator** and execute either of the following commands:

#### Option A: Unattended winget installation with password (Recommended)
```powershell
winget install PostgreSQL.PostgreSQL.16 --override "--mode unattended --superpassword postgres" --accept-package-agreements --accept-source-agreements
```
*Note: This automatically installs PostgreSQL 16 with default superuser `postgres` and password `postgres`.*

#### Option B: Standard interactive winget installation
```powershell
winget install PostgreSQL.PostgreSQL.16 --accept-package-agreements --accept-source-agreements
```
*Follow the on-screen wizard to choose your port (default `5432`) and specify your superuser password.*

#### Option C: Direct Installer Download
Download and run the installer directly from EnterpriseDB:
[PostgreSQL 16 Windows x64 Installer](https://get.enterprisedb.com/postgresql/postgresql-16.15-3-windows-x64.exe)

---

## 2. Database Creation

Once PostgreSQL is installed and the service is running, create the development database `acadagents`:

```powershell
# In PowerShell:
$env:PGPASSWORD = "your_postgres_password"
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres acadagents
```
Or via SQL:
```sql
CREATE DATABASE acadagents;
```

---

## 3. Schema Loading

Load the complete authoritative schema using `ON_ERROR_STOP=1` so that any syntax or constraint errors are immediately caught:

```powershell
# In PowerShell from c:\agent20:
$env:PGPASSWORD = "your_postgres_password"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d acadagents -v ON_ERROR_STOP=1 -f "data/schema_full.sql"
```

*Note*: The schema file `data/schema_full.sql` contains 3,988 lines and defines all 21 schemas. It is strictly authoritative and has not been modified.

---

## 4. Schema Validation

Verify the complete schema and all Agent 20 tables:

```sql
-- Check total schemas (expected: 21)
SELECT count(*) FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast');

-- Check total tables (expected: 219)
SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog');

-- Check total views (expected: 11)
SELECT count(*) FROM information_schema.views WHERE table_schema NOT IN ('information_schema', 'pg_catalog');

-- Verify key Agent 20 tables exist:
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE (table_schema = 'core' AND table_name IN ('institution', 'department', 'academic_year', 'term'))
   OR (table_schema = 'people' AND table_name IN ('person', 'faculty'))
   OR (table_schema = 'research' AND table_name IN ('publication', 'publication_author', 'publication_source', 'venue', 'venue_metric', 'citation_snapshot', 'patent', 'patent_inventor', 'project', 'project_member', 'phd_scholar', 'phd_milestone', 'funding_agency'))
   OR (table_schema = 'hr' AND table_name IN ('faculty_workload', 'admin_role_assignment'))
   OR (table_schema = 'quality' AND table_name IN ('kpi_definition', 'kpi_value'))
   OR (table_schema = 'agentops' AND table_name IN ('agent', 'agent_run', 'agent_run_input', 'agent_tool', 'agent_output'))
ORDER BY table_schema, table_name;
```

---

## 5. Seed Data Design

The synthetic benchmark seed data script [`data/seed_agent20.sql`](file:///c:/agent20/data/seed_agent20.sql) was constructed to provide realistic, discipline-differentiated academic data for demonstrating all 23 Agent 20 requirements:

1. **Institution (`core.institution`)**:
   - 1 synthetic institution: `APEX_A20` ("Apex Institute of Technology & Advanced Research").
2. **Departments (`core.department`)**:
   - 4 academic disciplines:
     - `CSE` (Computer Science & Engineering)
     - `MECH` (Mechanical Engineering)
     - `BIO` (Biotechnology & Bioinformatics)
     - `HSS` (Humanities & Social Sciences)
3. **Faculty Cohort (`people.person`, `people.faculty`)**:
   - 24 total faculty members (6 per department) spanning:
     - Assistant Professors (Early-career, joined 2020–2023)
     - Associate Professors (Mid-career, joined 2015–2018)
     - Professors (Senior, joined 2006–2012)
4. **Research Venues & Metrics (`research.venue`, `research.venue_metric`)**:
   - 24 synthetic venues across computer science, mechanics, biotechnology, humanities, and 1 predatory journal.
   - Multi-year metrics (2022, 2023, 2024) establishing Q1, Q2, Q3, Q4, Impact Factor, CiteScore, and SJR.
5. **Publications (`research.publication`, `research.publication_author`, `research.publication_source`)**:
   - 96 distinct publications (2020–2024) across `JOURNAL_ARTICLE`, `CONFERENCE_PAPER`, `BOOK_CHAPTER`.
   - Distinct discipline-specific output cultures:
     - *CSE*: High volume, conference and journal mix, fast turnaround.
     - *MECH*: Journal-heavy, patent-oriented, sponsored project focus.
     - *BIO*: High citation density, high journal impact factors.
     - *HSS*: Books, monographs, lower raw volume, longer publication cycles.
6. **Citations (`research.citation_snapshot`)**:
   - Longitudinal point-in-time snapshots at 2022-12-31, 2023-12-31, and 2024-12-31 for publications and faculty.
   - Enables computation of citation velocity, annual trends, and h-index trajectory over time.
7. **Patents (`research.patent`, `research.patent_inventor`)**:
   - 12 patents across robotics, materials, biotechnology, medical devices, and edge computing (`GRANTED`, `PUBLISHED`, `FILED`).
8. **Sponsored Projects (`research.funding_agency`, `research.project`, `research.project_member`)**:
   - 12 funded projects with agencies (DST, SERB, DBT, AICTE, Industry) ranging from ₹15 Lakhs to ₹1.5 Crores.
9. **PhD Scholars (`research.phd_scholar`, `research.phd_milestone`)**:
   - 16 doctoral scholars (4 per department) with progression milestones (`COURSEWORK`, `PROPOSAL_DEFENCE`, `AWARDED`, etc.).
10. **Workload & Administrative Burden (`hr.faculty_workload`, `hr.admin_role_assignment`)**:
    - Workload tracking across 3 terms (ODD 2023-24, EVEN 2023-24, ODD 2024-25) distinguishing teaching load from research and administration.
    - Administrative appointments (HOD, Dean of Research, NBA Coordinator, Chief Warden).

### Implementation of Required Scoring Test Cases
- **CASE A (High Volume, Low Quality)**: Dr. Rajesh Kumar (`EMP0002`, CSE Associate Prof) has 10 publications, but primarily in Q4 journals, regional unindexed bulletins, and 1 predatory journal.
- **CASE B (Low Volume, Top Quality)**: Dr. Ananya Sharma (`EMP0003`, CSE Assistant Prof) has 4 publications, all in top Q1 journals with strong citation traction.
- **CASE C (Heavy Administrative & Teaching Load)**: Dr. Vikramaditya Singh (`EMP0007`, MECH Professor & HOD & Dean) carries 24–30 weighted hours/week of administrative + teaching burden while maintaining 3 solid Q1/Q2 papers.
- **CASE D (High Publication Velocity in Junior Faculty)**: Dr. Sneha Patel (`EMP0014`, BIO Assistant Prof) joined in 2022; output accelerated from 1 paper in 2022, to 3 in 2023, to 5 in 2024.
- **CASE E (Departmental Output Concentration / High Gini)**: In MECH, 23 of the department's 28 publications are produced by just 2 senior professors (`EMP0008` Dr. Ramesh Rao and `EMP0009` Dr. Amit Verma), while other faculty have 1–2 papers.
- **CASE F (Departmental Broad Participation / Low Gini)**: In HSS, total output is lower (16 papers) but evenly distributed across all 6 faculty (2–3 papers each).
- **CASE G (Cross-Discipline Normalization Benchmark)**: Direct comparison between CSE and HSS demonstrates why raw publication counts are unfair without discipline normalization.

---

## 6. Seed Data Loading

Load the seed script into the `acadagents` database:

```powershell
# In PowerShell from c:\agent20:
$env:PGPASSWORD = "your_postgres_password"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d acadagents -v ON_ERROR_STOP=1 -f "data/seed_agent20.sql"
```

The script runs inside a single atomic transaction (`BEGIN; ... COMMIT;`), ensuring clean rollback on failure and idempotent re-runs.

---

## 7. Validation Results

Run the validation suite [`data/validate_agent20.sql`](file:///c:/agent20/data/validate_agent20.sql):

```powershell
# In PowerShell from c:\agent20:
$env:PGPASSWORD = "your_postgres_password"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d acadagents -f "data/validate_agent20.sql"
```

---

## 8. Table Counts

| Category | Table | Expected Seed Count |
| :--- | :--- | :--- |
| **Core** | `core.institution` | 1 |
| | `core.department` | 4 |
| | `core.academic_year` | 2 |
| | `core.term` | 3 |
| **People** | `people.person` | 40 (24 faculty + 16 scholars) |
| | `people.faculty` | 24 |
| **Research Output** | `research.venue` | 24 |
| | `research.venue_metric` | 72 (24 venues × 3 years) |
| | `research.publication` | 96 |
| | `research.publication_author` | 96 |
| | `research.publication_source` | 96 |
| | `research.citation_snapshot` | 260+ (time-series across 2022–2024) |
| **IPR & Grants** | `research.patent` | 12 |
| | `research.patent_inventor` | 12 |
| | `research.funding_agency` | 5 |
| | `research.project` | 12 |
| | `research.project_member` | 8 |
| **Doctoral** | `research.phd_scholar` | 16 |
| | `research.phd_milestone` | 32 |
| **Workload & Admin** | `hr.faculty_workload` | 72 (24 faculty × 3 terms) |
| | `hr.admin_role_assignment` | 7 |
| **Accreditation & Ops**| `quality.kpi_definition` | 2 |
| | `agentops.agent` | 1 |

---

## 9. Known Limitations
- The dataset does not include historical student attendance or course evaluations, as Agent 20 focuses strictly on research productivity and faculty workload.
- The `vector` (`pgvector`) extension remains commented out in `data/schema_full.sql` as text embeddings are not required for quantitative productivity scoring.
- Synthetic publications use realistic, discipline-grounded titles and synthetic DOIs under prefix `10.1000/synth.*`.

---

## 10. Synthetic-Data Disclaimer
> **DISCLAIMER**: All records generated by `data/seed_agent20.sql` (including institutional names, department configurations, faculty identities, publications, venue names, citation counts, and grant sanctions) are **100% synthetic demo data** created exclusively for hackathon demonstration and validation of Agent 20's analytical and normalization algorithms. They do not represent real persons or institutional data.

---

## 11. Next Step
Proceed to **Step 3 — Agent 20 Core Engine Implementation**:
1. Implement the SQL calculation and query layer for publication counts, quartile weighting (Q1–Q4), indexing status, authorship position weighting (1st vs corresponding vs co-author).
2. Implement normalization algorithms:
   - Discipline normalization (Field-Weighted Citation Impact & Field-Normalized Publication Rate).
   - Career stage / Experience normalization (years since joining/PhD).
   - Teaching and administrative load normalization.
3. Build longitudinal trend analysis (citations, h-index, grants over 2020–2024).
4. Implement department-level Gini / concentration index calculations.
