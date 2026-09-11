# Agent 20 Analytics Data Mapping

This document provides the authoritative, schema-grounded data mapping for **Agent 20 (Research Productivity Agent)** against the PostgreSQL 16 `acadagents` database. Every mapping is verified against the actual tables, columns, and seeded data in the active database.

---

## 1. Faculty Metrics

| Metric | Source Table | Source Column(s) | Transformation | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Faculty Identifier** | `people.faculty` | `faculty_id` (UUID) | None (Direct Primary Key) | Canonical UUID for faculty across all relationships |
| **Employee Code** | `people.faculty` | `employee_no` (text) | None | Institutional identifier (e.g. `EMP0001` to `EMP0024`) |
| **Full Name** | `people.person` | `full_name` (text) | Direct join via `people.faculty.person_id = people.person.person_id` | Human-readable title and name (e.g. `Dr. Arvind Ramanathan`) |
| **Email Address** | `people.person` | `primary_email` (text) | Direct join | Contact email for notifications and reports |
| **Department ID** | `people.faculty` | `department_id` (UUID) | Foreign Key to `core.department.department_id` | Core organizational alignment |
| **Department Code & Name** | `core.department` | `code` (text), `name` (text) | Direct join via `f.department_id = d.department_id` | e.g. `CSE`, `Department of Computer Science & Engineering` |
| **Designation** | `people.faculty` | `designation` (text) | None | Academic rank: `PROFESSOR`, `ASSOCIATE_PROFESSOR`, `ASSISTANT_PROFESSOR` |
| **Cadre** | `people.faculty` | `cadre` (text) | None | Track classification (e.g. `TEACHING_RESEARCH`) |
| **Employment Type** | `people.faculty` | `employment_type` (text) | None | Tenure status (e.g. `REGULAR`) |
| **Highest Qualification** | `people.faculty` | `highest_qualification` (text) | None | e.g. `PhD` |
| **PhD Holder Status** | `people.faculty` | `is_phd_holder` (boolean) | None | Boolean flag |
| **PhD Awarded Date** | `people.faculty` | `phd_awarded_on` (date) | None | Date doctorate was conferred |
| **Joining Date** | `people.faculty` | `date_of_joining` (date) | None | Baseline career anchor date |
| **Years of Experience** | **NOT AVAILABLE** | `date_of_joining` (date), `date_of_leaving` (date) | `ROUND((CURRENT_DATE - f.date_of_joining) / 365.25, 1)` | Stored column is absent. Derived dynamically via current date and joining date. |
| **Research Supervisor** | `people.faculty` | `is_research_supervisor` (boolean) | None | Eligibility flag to supervise doctoral candidates |
| **Faculty Status** | `people.faculty` | `status` (text) | None | `ACTIVE`, `ON_LEAVE`, `RETIRED` |

---

## 2. Publication Metrics

| Metric | Source Table | Source Column(s) | Transformation | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Publication Count** | **NOT AVAILABLE** (as a scalar column) | `research.publication.publication_id`, `research.publication_author.faculty_id` | `COUNT(DISTINCT p.publication_id)` joined on `research.publication_author` | Computed dynamically per faculty, department, or institution |
| **Publication Year** | `research.publication` | `published_year` (smallint) | None | Filter/partition year (e.g. 2020, 2021, 2022, 2023, 2024) |
| **Publication Month** | `research.publication` | `published_month` (smallint) | None | Optional calendar month (1–12) |
| **Exact Publication Date** | **NOT AVAILABLE** | `published_year`, `published_month` | `make_date(published_year::int, COALESCE(published_month, 1)::int, 1)` | Exact publication day is not stored; month/year date synthesis provides calendar alignment |
| **Publication Type** | `research.publication` | `publication_type` (text) | None | `JOURNAL_ARTICLE`, `CONFERENCE_PAPER`, `BOOK_CHAPTER` |
| **Publication Title** | `research.publication` | `title` (text) | None | Full article title |
| **DOI** | `research.publication` | `doi` (text) | None | Digital Object Identifier |
| **Venue Reference** | `research.publication` | `venue_id` (UUID) | Foreign Key to `research.venue.venue_id` | Links article to journal/conference master record |
| **Venue Name & Code** | `research.venue` | `name` (text), `short_name` (text), `venue_type` (text) | Direct join via `p.venue_id = v.venue_id` | e.g. `SATAI` (`Springer Advances in Artificial Intelligence`) |
| **Venue Quartile** | `research.venue_metric` | `quartile` (text) | `p.venue_id = vm.venue_id AND vm.metric_year = p.published_year` | Quartile tier: `Q1`, `Q2`, `Q3`, `Q4`. *Proxy note: For pre-2022 publications, fallback to earliest recorded metric year (2022)* |
| **Indexing Status** | `research.venue_metric` | `is_indexed` (boolean), `source` (text) | Joined on venue and year | Indexing status (`true`/`false`) in `SCOPUS`, `WOS`, etc. |
| **Predatory / Flagged Venue**| `research.venue` | `is_flagged` (boolean), `flag_reason` (text) | Direct join | Critical for quality gatekeeping (e.g. predatory journal detection) |
| **Authorship Position** | `research.publication_author` | `author_order` (smallint) | None | 1 = First Author, 2 = Second Author, etc. |
| **Corresponding Author** | `research.publication_author` | `is_corresponding` (boolean) | None | `true` if faculty is corresponding author |
| **Attribution Status** | `research.publication_author` | `attribution_status` (text) | None | `VERIFIED`, `CLAIMED`, `DISPUTED` |
| **Affiliation Verification** | `research.publication` | `affiliation_verified` (boolean) | None | Institutional affiliation verified flag |

---

## 3. Citation Metrics

| Metric | Source Table | Source Column(s) | Transformation | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Total Faculty Citations** | `research.citation_snapshot` | `citation_count` (integer), `subject_type` (text), `as_of_date` (date) | `SELECT citation_count FROM research.citation_snapshot WHERE subject_type = 'FACULTY' AND faculty_id = :id ORDER BY as_of_date DESC LIMIT 1` | Authoritative cumulative citation count as of latest snapshot date |
| **Publication Citations** | `research.citation_snapshot` | `citation_count` (integer), `publication_id` (UUID) | Latest `citation_count` where `subject_type = 'PUBLICATION'` | Citations per individual publication |
| **Citations by Year** | `research.citation_snapshot` | `as_of_date` (date), `citation_count` (integer) | Snapshot history across dates (`2022-12-31`, `2023-12-31`, `2024-12-31`) | Time-series snapshot of cumulative citations |
| **Annual Citations Incurred** | **NOT AVAILABLE** (as stored delta) | `citation_count`, `as_of_date` | `citation_count - LAG(citation_count) OVER (PARTITION BY faculty_id ORDER BY as_of_date)` | Incremental citations gained during the 12-month period |
| **Citation Growth Rate (%)** | **NOT AVAILABLE** (as pre-computed) | `citation_count` | `ROUND(((citation_count - prior_count)::numeric / NULLIF(prior_count, 0)) * 100, 1)` | Year-over-year percentage citation acceleration |
| **H-Index** | `research.citation_snapshot` | `h_index` (smallint) | Latest snapshot where `subject_type = 'FACULTY'` | Standard Hirsch index; can also be verified by ranking publication citation counts |
| **H-Index by Year** | `research.citation_snapshot` | `h_index` (smallint), `as_of_date` (date) | Time-series where `subject_type = 'FACULTY'` | Tracks faculty prestige growth over time |
| **i10-Index** | `research.citation_snapshot` | `i10_index` (smallint) | Latest snapshot where `subject_type = 'FACULTY'` | Publications with at least 10 citations |

---

## 4. Patent Metrics

| Metric | Source Table | Source Column(s) | Transformation | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Patent Identifier** | `research.patent` | `patent_id` (UUID) | None | Primary Key |
| **Patent Title** | `research.patent` | `title` (text) | None | Complete patent disclosure title |
| **Application Number** | `research.patent` | `application_no` (text) | None | Statutory application reference (e.g. `IN202141011111`) |
| **Publication Number** | `research.patent` | `publication_no` (text) | None | Official patent gazette publication number |
| **Grant Number** | `research.patent` | `grant_no` (text) | None | Conferred patent number (populated once granted) |
| **Jurisdiction** | `research.patent` | `jurisdiction` (text) | None | `IN` (India), `US` (United States), `EP` (Europe), `WO` (WIPO PCT) |
| **Filing Type** | `research.patent` | `filing_type` (text) | None | `ORDINARY`, `PCT_NATIONAL`, `PROVISIONAL` |
| **Technology Area** | `research.patent` | `technology_area` (text) | None | Classification (e.g. `Robotics`, `Advanced Materials`) |
| **Filing Date** | `research.patent` | `filed_on` (date) | None | Priority filing date |
| **Publication Date** | `research.patent` | `published_on` (date) | None | Gazette publication date |
| **Grant Date** | `research.patent` | `granted_on` (date) | None | Official grant conferring date |
| **Patent Status** | `research.patent` | `status` (text) | None | Lifecycle stage: `FILED`, `PUBLISHED`, `GRANTED`, `ABANDONED` |
| **Commercialisation** | `research.patent` | `commercialisation_status` (text) | None | `UNCOMMERCIALISED`, `LICENSED`, `COMMERCIALISED` |
| **Institutional Ownership** | `research.patent` | `institution_id` (UUID) | Foreign Key to `core.institution.institution_id` | Confirms institution as applicant/assignee |
| **Faculty Inventor** | `research.patent_inventor` | `faculty_id` (UUID) | Foreign Key to `people.faculty.faculty_id` | Attributed faculty inventor |
| **Inventor Order** | `research.patent_inventor` | `inventor_order` (smallint) | None | 1 = Lead Inventor, 2 = Co-Inventor |
| **Ownership Share** | `research.patent_inventor` | `ownership_share` (numeric) | None | Decimal percentage share of intellectual property (e.g. `1.0000`, `0.5000`) |

---

## 5. Funding Metrics

| Metric | Source Table | Source Column(s) | Transformation | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Project Identifier** | `research.project` | `project_id` (UUID) | None | Primary Key |
| **Project Title** | `research.project` | `title` (text) | None | Full title of sponsored grant or consultancy |
| **Sanction Number** | `research.project` | `sanction_no` (text) | None | Agency award number (e.g. `DST/GNC/2021/45`) |
| **Sanctioned Amount** | `research.project` | `sanctioned_amount` (numeric) | None | Total financial commitment sanctioned by agency |
| **Received Amount** | `research.project` | `received_amount` (numeric) | None | Total disbursements received by institution to date |
| **Funding Year** | **NOT AVAILABLE** | `start_date` (date) | `EXTRACT(YEAR FROM pr.start_date)::smallint` | Dedicated funding year column is absent; derived from grant commencement year |
| **Project Duration** | `research.project` | `start_date` (date), `end_date` (date) | `start_date` to `end_date` | Multi-year performance period |
| **Project Status** | `research.project` | `status` (text) | None | `ACTIVE`, `COMPLETED`, `TERMINATED` |
| **Project Type** | `research.project` | `project_type` (text) | None | `SPONSORED_RESEARCH`, `CONSULTANCY`, `SEED_GRANT` |
| **Funding Agency Name** | `research.funding_agency` | `name` (text), `code` (text), `agency_type` (text) | Direct join via `pr.funding_agency_id = fa.funding_agency_id` | e.g. `Department of Science and Technology` (`GOVERNMENT_CENTRAL`) |
| **Principal Investigator (PI)**| `research.project` | `pi_faculty_id` (UUID) | Direct join to `people.faculty.faculty_id` | Lead responsible faculty member |
| **Co-Investigator / Member** | `research.project_member` | `faculty_id` (UUID), `role` (text) | Joined via `pm.project_id = pr.project_id` | Member roles: `CO_PI`, `RA`, `SRF`, `JRF` |
| **Member Participation Window**| `research.project_member` | `from_date` (date), `to_date` (date) | None | Tenured dates on project team |
| **Proposal Origin** | `research.project` | `proposal_id` (UUID) | Foreign Key to `research.proposal.proposal_id` | Traces project back to initial competitive grant application |

---

## 6. PhD Supervision Metrics

| Metric | Source Table | Source Column(s) | Transformation | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Scholar Identifier** | `research.phd_scholar` | `phd_scholar_id` (UUID) | None | Primary Key |
| **Scholar Registration No** | `research.phd_scholar` | `registration_no` (text) | None | Official enrolment number (e.g. `PHD-CSE-2019-01`) |
| **Scholar Name** | `people.person` | `full_name` (text) | Direct join via `s.person_id = p.person_id` | Full name of doctoral scholar |
| **Department** | `research.phd_scholar` | `department_id` (UUID) | Foreign Key to `core.department.department_id` | Academic home of scholar |
| **Supervisor Faculty** | `research.phd_scholar` | `supervisor_faculty_id` (UUID) | Foreign Key to `people.faculty.faculty_id` | Primary faculty dissertation advisor |
| **Co-Supervisor Faculty** | `research.phd_scholar` | `co_supervisor_faculty_id` (UUID) | Foreign Key to `people.faculty.faculty_id` (nullable) | Optional secondary faculty advisor |
| **Enrolment Mode** | `research.phd_scholar` | `mode` (text) | None | `FULL_TIME`, `PART_TIME` |
| **Research Area** | `research.phd_scholar` | `research_area` (text) | None | Specialized subfield of research |
| **Registration Date** | `research.phd_scholar` | `registered_on` (date) | None | Doctoral program intake date |
| **Thesis Title** | `research.phd_scholar` | `thesis_title` (text) | None | Approved dissertation title |
| **Scholar Status** | `research.phd_scholar` | `status` (text) | None | `PURSUING`, `RESEARCH`, `SUBMITTED`, `AWARDED`, `DISCONTINUED` |
| **Awarded Date** | `research.phd_scholar` | `awarded_on` (date) | None | Conferred graduation date |
| **Milestone Identifier** | `research.phd_milestone`| `phd_milestone_id` (UUID) | None | Primary Key |
| **Milestone Type** | `research.phd_milestone`| `milestone_type` (text) | None | `COURSEWORK`, `PROPOSAL_DEFENCE`, `COMPREHENSIVE_VIVA`, `PRE_SYNOPSIS`, `THESIS_SUBMISSION`, `VIVA_VOCE` |
| **Milestone Sequence** | `research.phd_milestone`| `sequence_no` (smallint) | None | Chronological ordering of requirements (1, 2, 3...) |
| **Milestone Due Date** | `research.phd_milestone`| `due_date` (date) | None | Regulatory deadline |
| **Milestone Completion Date** | `research.phd_milestone`| `completed_on` (date) | None | Actual defense/completion date |
| **Milestone Status** | `research.phd_milestone`| `status` (text) | None | `COMPLETED`, `PENDING`, `DELAYED` |
| **Milestone Outcome** | `research.phd_milestone`| `outcome` (text), `remarks` (text) | None | e.g. `SATISFACTORY`, committee feedback |

---

## 7. Workload Normalization Metrics

Workload normalization ensures faculty research expectations are balanced against instructional obligations and heavy institutional administrative mandates.

| Metric | Source Table | Source Column(s) | Transformation | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Workload Record ID** | `hr.faculty_workload` | `faculty_workload_id` (UUID) | None | Primary Key |
| **Faculty Reference** | `hr.faculty_workload` | `faculty_id` (UUID) | Foreign Key to `people.faculty.faculty_id` | Attributed faculty member |
| **Academic Term** | `hr.faculty_workload` | `term_id` (UUID) | Foreign Key to `core.term.term_id` | Links to term label (e.g. `ODD 2023-24`, `EVEN 2023-24`) |
| **Term Details** | `core.term` | `label` (text), `start_date` (date), `end_date` (date) | Direct join via `fw.term_id = t.term_id` | Period definition |
| **Lecture Hours** | `hr.faculty_workload` | `lecture_hours` (numeric) | None | Scheduled classroom instruction hours/week |
| **Laboratory Hours** | `hr.faculty_workload` | `lab_hours` (numeric) | None | Scheduled laboratory instruction hours/week |
| **Tutorial Hours** | `hr.faculty_workload` | `tutorial_hours` (numeric) | None | Scheduled small-group tutorial hours/week |
| **Teaching Workload Total** | **NOT AVAILABLE** | `lecture_hours`, `lab_hours`, `tutorial_hours` | `(lecture_hours + lab_hours + tutorial_hours)` | Stored aggregate teaching column is absent; sum provides raw contact hours |
| **Academic Allocation** | `academics.faculty_allocation` | `course_offering_id` (UUID), `role` (text), `load_share` (numeric) | Joined on `fa.faculty_id = f.faculty_id` | Micro-level course assignment breakdown |
| **Doctoral Supervision Load** | `hr.faculty_workload` | `supervision_load` (numeric) | None | Weighted credit hours allocated for active PhD scholars |
| **Administrative Load** | `hr.faculty_workload` | `admin_load` (numeric) | None | Hours/week credited for administrative duties |
| **Research Load** | `hr.faculty_workload` | `research_load` (numeric) | None | Protected research time allocation |
| **Total Weighted Load** | `hr.faculty_workload` | `total_weighted_load` (numeric) | None | Overall effective workload hours |
| **Institutional Expected Norm**| `hr.faculty_workload` | `norm_expected` (numeric) | None | Institutional standard baseline (e.g. 18.0 or 16.0 hours/week) |
| **Workload Variance (%)** | `hr.faculty_workload` | `variance_pct` (numeric) | None | Percentage above or below expected standard |
| **Workload Classification** | `hr.faculty_workload` | `status` (text) | None | `WITHIN_NORM`, `OVERLOADED`, `SEVERE_OVERLOAD` |
| **Administrative Role Name** | `hr.admin_role_assignment` | `role_name` (text) | None | Dedicated duty: `HOD`, `DEAN_RESEARCH`, `IQAC_COORDINATOR`, `CHIEF_WARDEN`, `NBA_COORDINATOR` |
| **Admin Allocated Weight** | `hr.admin_role_assignment` | `workload_weight` (numeric) | None | Approved weekly reduction allowance (e.g. 12.0 or 15.0 hrs/week) |
| **Admin Tenure Window** | `hr.admin_role_assignment` | `from_date` (date), `to_date` (date) | None | Office term dates |
| **Department Headship** | `core.department` | `hod_faculty_id` (UUID) | `d.hod_faculty_id = f.faculty_id` | Direct executive reference indicating Head of Department |

---

## 8. Department Metrics Rollup

Department metrics aggregate individual faculty achievements and academic throughput into departmental benchmarks. 

### Aggregation Rules:
To eliminate cartesian inflation across independent one-to-many dimensions (publications, patents, projects, and scholars), departmental rollups **must** use dimension-isolated subqueries or Common Table Expressions (CTEs) before joining to `core.department`.

### Rollup Schema Mapping:

```sql
WITH dept_faculty AS (
    SELECT department_id,
           COUNT(faculty_id) AS active_faculty_count,
           COUNT(faculty_id) FILTER (WHERE designation = 'PROFESSOR') AS prof_count,
           COUNT(faculty_id) FILTER (WHERE designation = 'ASSOCIATE_PROFESSOR') AS assoc_prof_count,
           COUNT(faculty_id) FILTER (WHERE designation = 'ASSISTANT_PROFESSOR') AS asst_prof_count
    FROM people.faculty
    WHERE status = 'ACTIVE'
    GROUP BY department_id
),
dept_publications AS (
    SELECT f.department_id,
           COUNT(DISTINCT p.publication_id) AS total_publications,
           COUNT(DISTINCT p.publication_id) FILTER (WHERE vm.quartile = 'Q1') AS q1_publications,
           COUNT(DISTINCT p.publication_id) FILTER (WHERE vm.quartile = 'Q2') AS q2_publications,
           COUNT(DISTINCT p.publication_id) FILTER (WHERE vm.is_indexed = true) AS indexed_publications
    FROM people.faculty f
    JOIN research.publication_author pa ON f.faculty_id = pa.faculty_id
    JOIN research.publication p ON pa.publication_id = p.publication_id
    LEFT JOIN research.venue_metric vm ON p.venue_id = vm.venue_id AND vm.metric_year = p.published_year
    GROUP BY f.department_id
),
dept_patents AS (
    SELECT f.department_id,
           COUNT(DISTINCT pi.patent_id) AS total_patents,
           COUNT(DISTINCT pi.patent_id) FILTER (WHERE pt.status = 'GRANTED') AS granted_patents
    FROM people.faculty f
    JOIN research.patent_inventor pi ON f.faculty_id = pi.faculty_id
    JOIN research.patent pt ON pi.patent_id = pt.patent_id
    GROUP BY f.department_id
),
dept_projects AS (
    SELECT f.department_id,
           COUNT(DISTINCT pr.project_id) AS total_projects,
           COALESCE(SUM(pr.sanctioned_amount), 0) AS total_funding_sanctioned,
           COALESCE(SUM(pr.received_amount), 0) AS total_funding_received
    FROM people.faculty f
    JOIN research.project pr ON f.faculty_id = pr.pi_faculty_id
    GROUP BY f.department_id
),
dept_phd AS (
    SELECT s.department_id,
           COUNT(DISTINCT s.phd_scholar_id) AS total_scholars,
           COUNT(DISTINCT s.phd_scholar_id) FILTER (WHERE s.status = 'AWARDED') AS awarded_scholars,
           COUNT(DISTINCT s.phd_scholar_id) FILTER (WHERE s.status IN ('PURSUING', 'RESEARCH', 'SUBMITTED')) AS active_scholars
    FROM research.phd_scholar s
    GROUP BY s.department_id
),
dept_workload AS (
    SELECT f.department_id,
           ROUND(AVG(fw.total_weighted_load), 2) AS avg_workload,
           ROUND(AVG(fw.admin_load), 2) AS avg_admin_load,
           COUNT(fw.faculty_workload_id) FILTER (WHERE fw.status = 'SEVERE_OVERLOAD') AS overload_instances
    FROM people.faculty f
    JOIN hr.faculty_workload fw ON f.faculty_id = fw.faculty_id
    GROUP BY f.department_id
)
SELECT 
    d.department_id,
    d.code AS dept_code,
    d.name AS dept_name,
    COALESCE(df.active_faculty_count, 0) AS faculty_count,
    COALESCE(dp.total_publications, 0) AS publication_count,
    COALESCE(dp.q1_publications, 0) AS q1_count,
    COALESCE(dp.indexed_publications, 0) AS indexed_count,
    COALESCE(dpt.total_patents, 0) AS patent_count,
    COALESCE(dpt.granted_patents, 0) AS granted_patent_count,
    COALESCE(dpr.total_projects, 0) AS project_count,
    COALESCE(dpr.total_funding_sanctioned, 0) AS total_sanctioned_inr,
    COALESCE(dph.total_scholars, 0) AS total_phd_scholars,
    COALESCE(dph.awarded_scholars, 0) AS awarded_phd_scholars,
    COALESCE(dw.avg_workload, 0) AS avg_weekly_load,
    COALESCE(dw.overload_instances, 0) AS severe_overload_records
FROM core.department d
LEFT JOIN dept_faculty df ON d.department_id = df.department_id
LEFT JOIN dept_publications dp ON d.department_id = dp.department_id
LEFT JOIN dept_patents dpt ON d.department_id = dpt.department_id
LEFT JOIN dept_projects dpr ON d.department_id = dpr.department_id
LEFT JOIN dept_phd dph ON d.department_id = dph.department_id
LEFT JOIN dept_workload dw ON d.department_id = dw.department_id
ORDER BY d.code;
```

---

## 9. Institutional Metrics Rollup

Institutional metrics roll up all departments into university/institutional-level executive indicators for NAAC, NIRF, and governing body reporting.

### Rollup Schema Mapping:

```sql
WITH inst_dept AS (
    SELECT institution_id,
           COUNT(department_id) AS total_departments
    FROM core.department
    WHERE is_active = true
    GROUP BY institution_id
),
inst_faculty AS (
    SELECT d.institution_id,
           COUNT(f.faculty_id) AS total_faculty,
           COUNT(f.faculty_id) FILTER (WHERE f.is_phd_holder = true) AS phd_holding_faculty,
           COUNT(f.faculty_id) FILTER (WHERE f.is_research_supervisor = true) AS approved_supervisors
    FROM people.faculty f
    JOIN core.department d ON f.department_id = d.department_id
    WHERE f.status = 'ACTIVE'
    GROUP BY d.institution_id
),
inst_publications AS (
    SELECT p.institution_id,
           COUNT(DISTINCT p.publication_id) AS total_publications,
           COUNT(DISTINCT p.publication_id) FILTER (WHERE vm.quartile = 'Q1') AS q1_publications,
           COUNT(DISTINCT p.publication_id) FILTER (WHERE vm.quartile = 'Q2') AS q2_publications,
           COUNT(DISTINCT p.publication_id) FILTER (WHERE vm.is_indexed = true) AS scopus_wos_indexed_publications
    FROM research.publication p
    LEFT JOIN research.venue_metric vm ON p.venue_id = vm.venue_id AND vm.metric_year = p.published_year
    GROUP BY p.institution_id
),
inst_patents AS (
    SELECT pt.institution_id,
           COUNT(DISTINCT pt.patent_id) AS total_patents,
           COUNT(DISTINCT pt.patent_id) FILTER (WHERE pt.status = 'GRANTED') AS granted_patents,
           COUNT(DISTINCT pt.patent_id) FILTER (WHERE pt.status = 'PUBLISHED') AS published_patents
    FROM research.patent pt
    GROUP BY pt.institution_id
),
inst_funding AS (
    SELECT d.institution_id,
           COUNT(DISTINCT pr.project_id) AS total_sponsored_projects,
           COALESCE(SUM(pr.sanctioned_amount), 0) AS total_grant_inr_sanctioned,
           COALESCE(SUM(pr.received_amount), 0) AS total_grant_inr_received
    FROM research.project pr
    JOIN people.faculty f ON pr.pi_faculty_id = f.faculty_id
    JOIN core.department d ON f.department_id = d.department_id
    GROUP BY d.institution_id
),
inst_phd AS (
    SELECT d.institution_id,
           COUNT(DISTINCT s.phd_scholar_id) AS total_doctoral_enrolment,
           COUNT(DISTINCT s.phd_scholar_id) FILTER (WHERE s.status = 'AWARDED') AS doctoral_degrees_awarded
    FROM research.phd_scholar s
    JOIN core.department d ON s.department_id = d.department_id
    GROUP BY d.institution_id
)
SELECT 
    i.institution_id,
    i.code AS institution_code,
    i.name AS institution_name,
    COALESCE(id.total_departments, 0) AS department_count,
    COALESCE(ifa.total_faculty, 0) AS active_faculty_count,
    COALESCE(ifa.phd_holding_faculty, 0) AS phd_qualified_faculty,
    COALESCE(ip.total_publications, 0) AS publication_count,
    COALESCE(ip.q1_publications, 0) AS q1_publication_count,
    COALESCE(ip.scopus_wos_indexed_publications, 0) AS indexed_publication_count,
    COALESCE(ipt.total_patents, 0) AS patent_count,
    COALESCE(ipt.granted_patents, 0) AS granted_patent_count,
    COALESCE(ifu.total_sponsored_projects, 0) AS project_count,
    COALESCE(ifu.total_grant_inr_sanctioned, 0) AS total_funding_sanctioned_inr,
    COALESCE(iph.total_doctoral_enrolment, 0) AS doctoral_enrolment,
    COALESCE(iph.doctoral_degrees_awarded, 0) AS doctoral_degrees_conferred
FROM core.institution i
LEFT JOIN inst_dept id ON i.institution_id = id.institution_id
LEFT JOIN inst_faculty ifa ON i.institution_id = ifa.institution_id
LEFT JOIN inst_publications ip ON i.institution_id = ip.institution_id
LEFT JOIN inst_patents ipt ON i.institution_id = ipt.institution_id
LEFT JOIN inst_funding ifu ON i.institution_id = ifu.institution_id
LEFT JOIN inst_phd iph ON i.institution_id = iph.institution_id;
```

---

## 10. Summary of Missing Fields & Available Proxies

| Requested Metric | Database Status | Available Proxy / Derived Solution | Rationale |
| :--- | :--- | :--- | :--- |
| **Years of Experience** | **NOT AVAILABLE** | `ROUND((CURRENT_DATE - f.date_of_joining) / 365.25, 1)` | `people.faculty` records `date_of_joining` and `date_of_leaving`. Dynamically calculating fractional years against `CURRENT_DATE` avoids stale integer columns. |
| **Exact Publication Day** | **NOT AVAILABLE** | `make_date(p.published_year::int, COALESCE(p.published_month, 1)::int, 1)` | `research.publication` models `published_year` and `published_month` as smallints. Synthesizing the 1st of the month allows full SQL date comparisons and time-series bucketing. |
| **Incremental Annual Citations** | **NOT AVAILABLE** | `citation_count - LAG(citation_count) OVER (PARTITION BY faculty_id ORDER BY as_of_date)` | `research.citation_snapshot` stores cumulative totals at periodic dates (`2022-12-31`, `2023-12-31`, `2024-12-31`). Window lag calculates true annual delta. |
| **Annual Citation Growth Rate (%)** | **NOT AVAILABLE** | `ROUND(((citation_count - lag_count)::numeric / NULLIF(lag_count, 0)) * 100, 1)` | Derived from annual citation delta divided by prior year cumulative total. |
| **Dedicated Funding Year** | **NOT AVAILABLE** | `EXTRACT(YEAR FROM pr.start_date)::smallint` | `research.project` records precise grant period dates (`start_date`, `end_date`). Extracting year from `start_date` reliably isolates the award fiscal year. |
| **Total Teaching Hours** | **NOT AVAILABLE** | `(lecture_hours + lab_hours + tutorial_hours)` | `hr.faculty_workload` provides granular component columns. Summing them yields total contact instructional hours. |
| **Pre-2022 Venue Quartiles** | **NOT AVAILABLE** | `COALESCE(vm_exact.quartile, vm_earliest.quartile)` | `research.venue_metric` stores metrics for years 2022, 2023, 2024. For 2020–2021 publications, falling back to the earliest known venue metric (2022) ensures fair historical scoring. |
