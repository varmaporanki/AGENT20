-- ============================================================================
-- AGENT 20 — STEP 3A ANALYTICS SCHEMA MAPPING VALIDATION
-- Authoritative test queries demonstrating that all mapped fields return
-- real, verified synthetic data from the acadagents database.
-- ============================================================================

\echo '====================================================='
\echo 'AGENT 20 — STEP 3A DATA MAPPING VALIDATION QUERIES'
\echo '====================================================='

-- ----------------------------------------------------------------------------
-- 1. FACULTY IDENTITY & EXPERIENCE
-- Maps: faculty_id, employee_no, person_id, full_name, email, designation,
--       cadre, qualification, joining date, and derived years of experience.
-- ----------------------------------------------------------------------------
\echo '--- 1. FACULTY IDENTITY & EXPERIENCE ---'
SELECT 
    f.employee_no,
    p.full_name,
    p.primary_email,
    f.designation,
    f.cadre,
    f.highest_qualification,
    f.is_phd_holder,
    f.date_of_joining,
    ROUND((CURRENT_DATE - f.date_of_joining) / 365.25, 1) AS years_experience,
    f.status AS faculty_status
FROM people.faculty f
JOIN people.person p ON f.person_id = p.person_id
ORDER BY f.date_of_joining ASC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 2. DEPARTMENTS & INSTITUTIONAL HIERARCHY
-- Maps: department_id, code, name, institution_id, HOD faculty reference
-- ----------------------------------------------------------------------------
\echo '--- 2. DEPARTMENTS & INSTITUTIONAL HIERARCHY ---'
SELECT 
    d.code AS dept_code,
    d.name AS dept_name,
    i.code AS inst_code,
    i.name AS inst_name,
    f.employee_no AS hod_employee_no,
    p.full_name AS hod_name
FROM core.department d
JOIN core.institution i ON d.institution_id = i.institution_id
LEFT JOIN people.faculty f ON d.hod_faculty_id = f.faculty_id
LEFT JOIN people.person p ON f.person_id = p.person_id
ORDER BY d.code;

-- ----------------------------------------------------------------------------
-- 3. PUBLICATIONS & METADATA
-- Maps: publication_id, title, publication_type, published_year, published_month,
--       derived publication_date proxy, doi, affiliation_verified, review_status
-- ----------------------------------------------------------------------------
\echo '--- 3. PUBLICATIONS & METADATA ---'
SELECT 
    p.publication_id,
    LEFT(p.title, 55) AS truncated_title,
    p.publication_type,
    p.published_year,
    p.published_month,
    make_date(p.published_year::int, COALESCE(p.published_month, 1)::int, 1) AS pub_date_proxy,
    p.doi,
    p.affiliation_verified,
    p.review_status
FROM research.publication p
ORDER BY p.published_year DESC, p.published_month DESC NULLS LAST
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 4. AUTHORSHIP & ATTRIBUTION
-- Maps: author_order, is_corresponding, attribution_status, faculty author
-- ----------------------------------------------------------------------------
\echo '--- 4. AUTHORSHIP & ATTRIBUTION ---'
SELECT 
    pa.publication_id,
    f.employee_no,
    p.full_name AS faculty_author,
    pa.author_order,
    pa.is_corresponding,
    pa.attribution_status,
    CASE 
        WHEN pa.author_order = 1 AND pa.is_corresponding THEN 'FIRST & CORRESPONDING'
        WHEN pa.author_order = 1 THEN 'FIRST AUTHOR'
        WHEN pa.is_corresponding THEN 'CORRESPONDING'
        ELSE 'CO-AUTHOR'
    END AS authorship_role
FROM research.publication_author pa
JOIN people.faculty f ON pa.faculty_id = f.faculty_id
JOIN people.person p ON f.person_id = p.person_id
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 5. VENUE QUALITY, INDEXING & QUARTILE
-- Maps: venue name, short_name, venue_type, quartile, is_indexed, impact_factor,
--       is_flagged, flag_reason (predatory check)
-- ----------------------------------------------------------------------------
\echo '--- 5. VENUE QUALITY, INDEXING & QUARTILE ---'
SELECT 
    v.short_name AS venue_code,
    LEFT(v.name, 45) AS venue_name,
    v.venue_type,
    vm.metric_year,
    vm.quartile,
    vm.is_indexed,
    vm.source AS index_source,
    vm.impact_factor,
    v.is_flagged,
    v.flag_reason
FROM research.venue v
LEFT JOIN research.venue_metric vm ON v.venue_id = vm.venue_id
ORDER BY v.short_name, vm.metric_year DESC NULLS LAST
LIMIT 8;

-- ----------------------------------------------------------------------------
-- 6. CITATION SNAPSHOTS, GROWTH & H-INDEX
-- Maps: faculty citation snapshots, longitudinal growth across snapshot dates,
--       h-index, i10-index, source
-- ----------------------------------------------------------------------------
\echo '--- 6. CITATION SNAPSHOTS, GROWTH & H-INDEX ---'
SELECT 
    f.employee_no,
    p.full_name,
    cs.as_of_date,
    cs.citation_count,
    cs.h_index,
    cs.i10_index,
    cs.citation_count - LAG(cs.citation_count) OVER (
        PARTITION BY f.faculty_id ORDER BY cs.as_of_date
    ) AS annual_citation_growth,
    ROUND(
        ((cs.citation_count - LAG(cs.citation_count) OVER (PARTITION BY f.faculty_id ORDER BY cs.as_of_date))::numeric 
        / NULLIF(LAG(cs.citation_count) OVER (PARTITION BY f.faculty_id ORDER BY cs.as_of_date), 0)) * 100, 
        1
    ) AS citation_growth_pct
FROM research.citation_snapshot cs
JOIN people.faculty f ON cs.faculty_id = f.faculty_id
JOIN people.person p ON f.person_id = p.person_id
WHERE cs.subject_type = 'FACULTY' AND f.employee_no IN ('EMP0001', 'EMP0002', 'EMP0014')
ORDER BY f.employee_no, cs.as_of_date;

-- ----------------------------------------------------------------------------
-- 7. PATENTS & INVENTORSHIP
-- Maps: patent title, application_no, jurisdiction, patent status, filed_on,
--       granted_on, inventor faculty, inventor_order, ownership_share
-- ----------------------------------------------------------------------------
\echo '--- 7. PATENTS & INVENTORSHIP ---'
SELECT 
    pt.patent_id,
    LEFT(pt.title, 50) AS patent_title,
    pt.application_no,
    pt.jurisdiction,
    pt.status AS patent_status,
    pt.filed_on,
    pt.granted_on,
    f.employee_no AS inventor_emp_no,
    p.full_name AS inventor_name,
    pi.inventor_order,
    pi.ownership_share
FROM research.patent pt
JOIN research.patent_inventor pi ON pt.patent_id = pi.patent_id
JOIN people.faculty f ON pi.faculty_id = f.faculty_id
JOIN people.person p ON f.person_id = p.person_id
ORDER BY pt.filed_on DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 8. PROJECT FUNDING & MEMBERSHIP
-- Maps: project title, sanction_no, funding agency, sanctioned_amount,
--       received_amount, funding_year proxy, start_date, end_date, PI and co-PI
-- ----------------------------------------------------------------------------
\echo '--- 8. PROJECT FUNDING & MEMBERSHIP ---'
SELECT 
    pr.project_id,
    LEFT(pr.title, 45) AS project_title,
    pr.sanction_no,
    fa.code AS agency_code,
    pr.sanctioned_amount,
    pr.received_amount,
    EXTRACT(YEAR FROM pr.start_date) AS funding_year,
    pr.start_date,
    pr.end_date,
    pr.status AS project_status,
    f.employee_no AS pi_emp_no,
    p.full_name AS pi_name
FROM research.project pr
JOIN research.funding_agency fa ON pr.funding_agency_id = fa.funding_agency_id
JOIN people.faculty f ON pr.pi_faculty_id = f.faculty_id
JOIN people.person p ON f.person_id = p.person_id
ORDER BY pr.start_date DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 9. PHD SUPERVISION & MILESTONES
-- Maps: scholar name, registration_no, supervisor faculty, scholar status,
--       registered_on, awarded_on, milestone_type, due_date, completed_on
-- ----------------------------------------------------------------------------
\echo '--- 9. PHD SUPERVISION & MILESTONES ---'
SELECT 
    s.registration_no,
    sp.full_name AS scholar_name,
    f.employee_no AS supervisor_emp_no,
    fp.full_name AS supervisor_name,
    s.status AS scholar_status,
    s.registered_on,
    s.awarded_on,
    m.milestone_type,
    m.sequence_no,
    m.due_date,
    m.completed_on,
    m.status AS milestone_status
FROM research.phd_scholar s
JOIN people.person sp ON s.person_id = sp.person_id
JOIN people.faculty f ON s.supervisor_faculty_id = f.faculty_id
JOIN people.person fp ON f.person_id = fp.person_id
LEFT JOIN research.phd_milestone m ON s.phd_scholar_id = m.phd_scholar_id
ORDER BY s.registration_no, m.sequence_no
LIMIT 6;

-- ----------------------------------------------------------------------------
-- 10. TEACHING WORKLOAD & VARIANCE
-- Maps: faculty, term_label, lecture_hours, lab_hours, tutorial_hours,
--       total_teaching_hours proxy, admin_load, total_weighted_load, norm_expected,
--       variance_pct, workload status
-- ----------------------------------------------------------------------------
\echo '--- 10. TEACHING WORKLOAD & VARIANCE ---'
SELECT 
    f.employee_no,
    p.full_name,
    t.label AS term_label,
    fw.lecture_hours,
    fw.lab_hours,
    fw.tutorial_hours,
    (fw.lecture_hours + fw.lab_hours + fw.tutorial_hours) AS total_teaching_hours,
    fw.admin_load,
    fw.total_weighted_load,
    fw.norm_expected,
    fw.variance_pct,
    fw.status AS workload_status
FROM hr.faculty_workload fw
JOIN people.faculty f ON fw.faculty_id = f.faculty_id
JOIN people.person p ON f.person_id = p.person_id
JOIN core.term t ON fw.term_id = t.term_id
WHERE f.employee_no IN ('EMP0001', 'EMP0007')
ORDER BY f.employee_no, t.start_date
LIMIT 6;

-- ----------------------------------------------------------------------------
-- 11. ADMINISTRATIVE RESPONSIBILITY & GOVERNANCE
-- Maps: role_name, workload_weight, from_date, to_date, order_ref
-- ----------------------------------------------------------------------------
\echo '--- 11. ADMINISTRATIVE RESPONSIBILITY & GOVERNANCE ---'
SELECT 
    f.employee_no,
    p.full_name,
    ara.role_name,
    ara.workload_weight AS weekly_hours_allocated,
    ara.from_date,
    ara.to_date,
    ara.order_ref
FROM hr.admin_role_assignment ara
JOIN people.faculty f ON ara.faculty_id = f.faculty_id
JOIN people.person p ON f.person_id = p.person_id
ORDER BY ara.workload_weight DESC, ara.from_date ASC;
