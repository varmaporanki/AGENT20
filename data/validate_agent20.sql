-- =====================================================================
-- AGENT 20 — RESEARCH PRODUCTIVITY AGENT
-- MVP DATABASE VALIDATION SCRIPT
-- =====================================================================

\echo '====================================================='
\echo 'AGENT 20 DATABASE VALIDATION REPORT'
\echo '====================================================='

\echo '\n--- 1. CORE ENTITY RECORD COUNTS ---'
SELECT 
    (SELECT COUNT(*) FROM core.institution WHERE code = 'APEX_A20') AS institution_count,
    (SELECT COUNT(*) FROM core.department WHERE institution_id = '00000000-0000-0000-0000-000000000001') AS department_count,
    (SELECT COUNT(*) FROM people.faculty f JOIN core.department d ON f.department_id = d.department_id WHERE d.institution_id = '00000000-0000-0000-0000-000000000001') AS faculty_count;

\echo '\n--- 2. RESEARCH OUTPUT & METRIC COUNTS ---'
SELECT
    (SELECT COUNT(*) FROM research.publication WHERE institution_id = '00000000-0000-0000-0000-000000000001') AS publication_count,
    (SELECT COUNT(*) FROM research.publication_author pa JOIN research.publication p ON pa.publication_id = p.publication_id WHERE p.institution_id = '00000000-0000-0000-0000-000000000001') AS publication_author_count,
    (SELECT COUNT(*) FROM research.venue WHERE name LIKE 'Synthetic %') AS venue_count,
    (SELECT COUNT(*) FROM research.venue_metric vm JOIN research.venue v ON vm.venue_id = v.venue_id WHERE v.name LIKE 'Synthetic %') AS venue_metric_count,
    (SELECT COUNT(*) FROM research.citation_snapshot cs LEFT JOIN research.publication p ON cs.publication_id = p.publication_id WHERE p.institution_id = '00000000-0000-0000-0000-000000000001' OR cs.subject_type = 'FACULTY') AS citation_snapshot_count;

\echo '\n--- 3. PATENTS & PROJECTS COUNTS ---'
SELECT
    (SELECT COUNT(*) FROM research.patent WHERE institution_id = '00000000-0000-0000-0000-000000000001') AS patent_count,
    (SELECT COUNT(*) FROM research.patent_inventor pi JOIN research.patent p ON pi.patent_id = p.patent_id WHERE p.institution_id = '00000000-0000-0000-0000-000000000001') AS patent_inventor_count,
    (SELECT COUNT(*) FROM research.project pr JOIN people.faculty f ON pr.pi_faculty_id = f.faculty_id JOIN core.department d ON f.department_id = d.department_id WHERE d.institution_id = '00000000-0000-0000-0000-000000000001') AS project_count,
    (SELECT COUNT(*) FROM research.project_member pm JOIN research.project pr ON pm.project_id = pr.project_id JOIN people.faculty f ON pr.pi_faculty_id = f.faculty_id JOIN core.department d ON f.department_id = d.department_id WHERE d.institution_id = '00000000-0000-0000-0000-000000000001') AS project_member_count;

\echo '\n--- 4. PHD SCHOLARS & WORKLOAD COUNTS ---'
SELECT
    (SELECT COUNT(*) FROM research.phd_scholar s JOIN core.department d ON s.department_id = d.department_id WHERE d.institution_id = '00000000-0000-0000-0000-000000000001') AS phd_scholar_count,
    (SELECT COUNT(*) FROM research.phd_milestone m JOIN research.phd_scholar s ON m.phd_scholar_id = s.phd_scholar_id JOIN core.department d ON s.department_id = d.department_id WHERE d.institution_id = '00000000-0000-0000-0000-000000000001') AS phd_milestone_count,
    (SELECT COUNT(*) FROM hr.faculty_workload w JOIN people.faculty f ON w.faculty_id = f.faculty_id JOIN core.department d ON f.department_id = d.department_id WHERE d.institution_id = '00000000-0000-0000-0000-000000000001') AS faculty_workload_count,
    (SELECT COUNT(*) FROM hr.admin_role_assignment a JOIN people.faculty f ON a.faculty_id = f.faculty_id JOIN core.department d ON f.department_id = d.department_id WHERE d.institution_id = '00000000-0000-0000-0000-000000000001') AS admin_role_count;

\echo '\n--- 5. INTEGRITY & ORPHAN CHECKS ---'
-- Check 1: Publications without authors
SELECT 'Publications without authors' AS check_name, COUNT(*) AS failing_records
FROM research.publication p
WHERE p.institution_id = '00000000-0000-0000-0000-000000000001'
  AND NOT EXISTS (SELECT 1 FROM research.publication_author pa WHERE pa.publication_id = p.publication_id)
UNION ALL
-- Check 2: Publication authors with invalid faculty reference
SELECT 'Invalid publication author faculty references' AS check_name, COUNT(*) AS failing_records
FROM research.publication_author pa
WHERE pa.faculty_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM people.faculty f WHERE f.faculty_id = pa.faculty_id)
UNION ALL
-- Check 3: Patent inventors with invalid faculty reference
SELECT 'Invalid patent inventor faculty references' AS check_name, COUNT(*) AS failing_records
FROM research.patent_inventor pi
WHERE pi.faculty_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM people.faculty f WHERE f.faculty_id = pi.faculty_id)
UNION ALL
-- Check 4: Project members with invalid faculty reference
SELECT 'Invalid project member faculty references' AS check_name, COUNT(*) AS failing_records
FROM research.project_member pm
WHERE pm.faculty_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM people.faculty f WHERE f.faculty_id = pm.faculty_id)
UNION ALL
-- Check 5: Faculty with invalid department reference
SELECT 'Invalid faculty department references' AS check_name, COUNT(*) AS failing_records
FROM people.faculty f
WHERE NOT EXISTS (SELECT 1 FROM core.department d WHERE d.department_id = f.department_id);

\echo '\n--- 6. DISCIPLINE & LONGITUDINAL SPREAD CHECKS ---'
-- Check departments have research output
SELECT d.code AS dept_code, d.name AS dept_name, COUNT(DISTINCT p.publication_id) AS publication_count, COUNT(DISTINCT f.faculty_id) AS faculty_count
FROM core.department d
JOIN people.faculty f ON f.department_id = d.department_id
LEFT JOIN research.publication_author pa ON pa.faculty_id = f.faculty_id
LEFT JOIN research.publication p ON pa.publication_id = p.publication_id
WHERE d.institution_id = '00000000-0000-0000-0000-000000000001'
GROUP BY d.code, d.name
ORDER BY publication_count DESC;

\echo '\n--- 7. PUBLICATION & CITATION YEARS SPREAD ---'
SELECT 
    MIN(published_year) AS earliest_pub_year,
    MAX(published_year) AS latest_pub_year,
    COUNT(DISTINCT published_year) AS distinct_pub_years
FROM research.publication
WHERE institution_id = '00000000-0000-0000-0000-000000000001';

SELECT 
    MIN(as_of_date) AS earliest_citation_snapshot,
    MAX(as_of_date) AS latest_citation_snapshot,
    COUNT(DISTINCT as_of_date) AS distinct_snapshot_dates
FROM research.citation_snapshot;

\echo '\n--- 8. AGENT 20 SPECIFIC TEST CASE VALIDATION ---'
-- Case A: Dr. Rajesh Kumar (High volume, low quality)
SELECT f.employee_no, p.full_name, COUNT(pub.publication_id) AS total_pubs,
       COUNT(CASE WHEN vm.quartile IN ('Q4','NA') THEN 1 END) AS low_or_unindexed_pubs,
       COUNT(CASE WHEN vm.quartile = 'Q1' THEN 1 END) AS q1_pubs
FROM people.faculty f
JOIN people.person p ON f.person_id = p.person_id
JOIN research.publication_author pa ON pa.faculty_id = f.faculty_id
JOIN research.publication pub ON pa.publication_id = pub.publication_id
LEFT JOIN research.venue_metric vm ON pub.venue_id = vm.venue_id AND vm.metric_year = pub.published_year
WHERE f.employee_no IN ('EMP0002', 'EMP0003', 'EMP0007', 'EMP0014')
GROUP BY f.employee_no, p.full_name
ORDER BY f.employee_no;
