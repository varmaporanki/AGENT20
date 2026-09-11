"""
Authoritative Database Query & Formatting Service
Transforms PostgreSQL records into strictly typed API payloads.
"""
from typing import Dict, Any, List, Optional
from .db import get_db_cursor, serialize_row

def format_faculty_record(row: Dict[str, Any], include_details: bool = False, cur = None) -> Dict[str, Any]:
    emp_no = row["employee_no"]
    faculty_id = str(row["faculty_id"])
    
    # Applied weights
    applied_weights = {
        "publication": float(row.get("w_pub", 0.35)),
        "citation": float(row.get("w_cit", 0.25)),
        "patents": float(row.get("w_pat", 0.15)),
        "funding": float(row.get("w_fund", 0.15)),
        "phd": float(row.get("w_phd", 0.10)),
        "weight_sum": float(row.get("weight_sum", 1.00))
    }
    
    # Normalized components (0.0 to 100.0)
    components = {
        "publication_quality": float(row["norm_pub"]) if row.get("norm_pub") is not None else None,
        "citation_impact": float(row["norm_cit"]) if row.get("norm_cit") is not None else None,
        "patents": float(row["norm_pat"]) if row.get("norm_pat") is not None else None,
        "funding": float(row["norm_fund"]) if row.get("norm_fund") is not None else None,
        "phd_supervision": float(row["norm_phd"]) if row.get("norm_phd") is not None else None
    }
    
    # Raw metrics
    raw_metrics = {
        "total_pubs": int(row.get("total_pubs", 0)),
        "q1_pubs": int(row.get("q1_pubs", 0)),
        "q2_pubs": int(row.get("q2_pubs", 0)),
        "q3_q4_pubs": int(row.get("q3_q4_pubs", 0)),
        "unindexed_pubs": int(row.get("unindexed_pubs", 0)),
        "flagged_pubs": int(row.get("flagged_pubs", 0)),
        "cits_latest": int(row.get("cits_latest", 0)),
        "h_index": int(row.get("h_index", 0)),
        "i10_index": int(row.get("i10_index", 0)),
        "cit_growth": int(row.get("cit_growth", 0)),
        "patent_count": int(row.get("patent_count", 0)),
        "granted_patents": int(row.get("granted_patents", 0)),
        "total_sanctioned_lakhs": round(float(row.get("total_sanctioned_amount", 0.0)) / 100000.0, 1),
        "pi_project_count": int(row.get("pi_project_count", 0)),
        "copi_project_count": int(row.get("copi_project_count", 0)),
        "total_scholars": int(row.get("total_scholars", 0)),
        "awarded_scholars": int(row.get("awarded_scholars", 0))
    }
    
    # Workload context
    workload_context = {
        "teaching_hours": float(row.get("avg_teaching_hours", 12.0)),
        "administrative_load": float(row.get("avg_admin_load", 0.0)),
        "workload_variance_pct": float(row.get("avg_variance_pct", 0.0)),
        "workload_multiplier": float(row.get("load_multiplier", 1.0)),
        "career_stage_multiplier": float(row.get("stage_factor", 1.0)),
        "combined_adjustment": round(float(row.get("combined_context_factor", 1.0)), 3)
    }
    
    # Evidence & facts dynamically generated from database attributes
    evidence = [
        f"{raw_metrics['total_pubs']} total publications authored ({raw_metrics['q1_pubs'] + raw_metrics['q2_pubs']} in Q1/Q2, {raw_metrics['unindexed_pubs']} unindexed/predatory)",
        f"Principal Investigator on {raw_metrics['pi_project_count']} grant(s) with {raw_metrics['total_sanctioned_lakhs']} Lakhs INR sanctioned",
        f"Career stage factor: {workload_context['career_stage_multiplier']} for {row['designation']} with {row['exp_years']} years experience as of {row['eval_date']}"
    ]
    
    explanation_facts = [
        f"Quality-weighted publication score ({components['publication_quality']}) reflects placement in indexed venues",
        f"Captured funding score ({components['funding']}/100) through competitive grants",
        f"Earned {float(row['final_score'])} final score with department rank {row['dept_rank']} of 6 (institution rank {row['inst_rank']} of 24)"
    ]
    
    result = {
        "faculty_id": faculty_id,
        "employee_no": emp_no,
        "name": row["full_name"],
        "department": row["dept_code"],
        "department_name": row["dept_name"],
        "designation": row["designation"],
        "evaluation_date": row["eval_date"].isoformat() if hasattr(row["eval_date"], "isoformat") else str(row["eval_date"]),
        "experience_years": float(row["exp_years"]),
        "base_score": round(float(row["base_research_score"]), 1) if row.get("base_research_score") is not None else None,
        "final_score": float(row["final_score"]) if row.get("final_score") is not None else None,
        "rank_within_department": int(row["dept_rank"]) if row.get("dept_rank") is not None else None,
        "rank_institution": int(row["inst_rank"]) if row.get("inst_rank") is not None else None,
        "applied_weights": applied_weights,
        "components": components,
        "raw_metrics": raw_metrics,
        "workload_context": workload_context,
        "evidence": evidence,
        "explanation_facts": explanation_facts
    }
    
    if include_details and cur:
        # Fetch publications
        cur.execute("""
            SELECT p.publication_id AS id, p.title, COALESCE(v.short_name, v.name, 'Unknown Venue') AS venue,
                   p.published_year AS year, 
                   COALESCE(vm.quartile, CASE WHEN vm.is_indexed THEN 'Indexed' ELSE 'Unindexed' END) AS quartile,
                   COALESCE(cs.citation_count, 0) AS citations,
                   pa.is_corresponding AS "isCorresponding",
                   pa.author_order AS "authorOrder"
            FROM research.publication_author pa
            JOIN research.publication p ON pa.publication_id = p.publication_id
            LEFT JOIN research.venue v ON p.venue_id = v.venue_id
            LEFT JOIN LATERAL (
                SELECT vm.quartile, vm.is_indexed
                FROM research.venue_metric vm
                WHERE vm.venue_id = p.venue_id
                ORDER BY ABS(vm.metric_year - p.published_year) ASC
                LIMIT 1
            ) vm ON true
            LEFT JOIN research.citation_snapshot cs ON cs.publication_id = p.publication_id 
                                                   AND cs.subject_type = 'PUBLICATION' 
                                                   AND cs.as_of_date = DATE '2024-12-31'
            WHERE pa.faculty_id = %s
            ORDER BY p.published_year DESC, citations DESC;
        """, (faculty_id,))
        result["publications"] = serialize_row(cur.fetchall())
        
        # Fetch projects
        cur.execute("""
            SELECT pr.project_id AS id, pr.title, COALESCE(fa.name, 'Funding Agency') AS agency,
                   ROUND(pr.sanctioned_amount / 100000.0, 1) AS "sanctionedLakhs",
                   'PI' AS role, pr.status
            FROM research.project pr
            LEFT JOIN research.funding_agency fa ON pr.funding_agency_id = fa.funding_agency_id
            WHERE pr.pi_faculty_id = %s
            UNION ALL
            SELECT pr.project_id AS id, pr.title, COALESCE(fa.name, 'Funding Agency') AS agency,
                   ROUND(pr.sanctioned_amount / 100000.0, 1) AS "sanctionedLakhs",
                   pm.role AS role, pr.status
            FROM research.project_member pm
            JOIN research.project pr ON pm.project_id = pr.project_id
            LEFT JOIN research.funding_agency fa ON pr.funding_agency_id = fa.funding_agency_id
            WHERE pm.faculty_id = %s
            ORDER BY "sanctionedLakhs" DESC;
        """, (faculty_id, faculty_id))
        result["projects"] = serialize_row(cur.fetchall())
        
        # Fetch citation snapshots
        cur.execute("""
            SELECT EXTRACT(YEAR FROM as_of_date)::int AS year,
                   citation_count AS citations,
                   h_index AS "hIndex"
            FROM research.citation_snapshot
            WHERE subject_type = 'FACULTY' AND faculty_id = %s
            ORDER BY year ASC;
        """, (faculty_id,))
        result["citation_history"] = serialize_row(cur.fetchall())
        
    return result

def get_all_faculty(
    search: Optional[str] = None,
    dept: Optional[str] = None,
    designation: Optional[str] = None,
    sort_by: Optional[str] = None,
    order: Optional[str] = "asc"
) -> Dict[str, Any]:
    with get_db_cursor() as cur:
        query = "SELECT * FROM v_step3b_scoring_engine WHERE 1=1"
        params = []
        
        if search:
            query += " AND (full_name ILIKE %s OR employee_no ILIKE %s)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param])
            
        if dept and dept != "ALL":
            query += " AND dept_code = %s"
            params.append(dept)
            
        if designation and designation != "ALL":
            query += " AND designation = %s"
            params.append(designation)
            
        # Sorting
        valid_sort_cols = {
            "final_score": "final_score",
            "total_pubs": "total_pubs",
            "cits_latest": "cits_latest",
            "total_sanctioned_lakhs": "total_sanctioned_amount",
            "patent_count": "patent_count",
            "rank_institution": "inst_rank",
            "inst_rank": "inst_rank",
            "name": "full_name"
        }
        
        sort_col = valid_sort_cols.get(sort_by, "inst_rank")
        sort_dir = "DESC" if order and order.lower() == "desc" else "ASC"
        
        # Invert default for score/pubs if not specified
        if not order and sort_by in ["final_score", "total_pubs", "cits_latest"]:
            sort_dir = "DESC"
            
        query += f" ORDER BY {sort_col} {sort_dir}, total_pubs DESC"
        
        cur.execute(query, tuple(params))
        rows = cur.fetchall()
        
        faculty_list = [format_faculty_record(r, include_details=False, cur=cur) for r in rows]
        return {
            "faculty": faculty_list,
            "total": len(faculty_list)
        }

def get_faculty_by_id_or_code(id_or_emp_no: str) -> Optional[Dict[str, Any]]:
    with get_db_cursor() as cur:
        cur.execute("""
            SELECT * FROM v_step3b_scoring_engine 
            WHERE faculty_id::text = %s OR employee_no = %s
            LIMIT 1;
        """, (id_or_emp_no, id_or_emp_no))
        row = cur.fetchone()
        if not row:
            return None
        return format_faculty_record(row, include_details=True, cur=cur)

def get_department_benchmarks(dept_code: Optional[str] = None) -> List[Dict[str, Any]]:
    with get_db_cursor() as cur:
        query = """
            SELECT 
                dept_code,
                dept_name,
                COUNT(*) as faculty_count,
                ROUND(AVG(final_score), 1) as mean_score,
                ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY final_score)::numeric, 1) as median_score,
                MAX(final_score) as top_score,
                SUM(total_pubs) as total_pubs,
                ROUND(SUM(q1_pubs)::numeric / NULLIF(SUM(total_pubs), 0) * 100.0, 1) as q1_percentage,
                SUM(cits_latest) as total_cits,
                ROUND(SUM(total_sanctioned_amount) / 100000.0, 1) as total_funding_lakhs,
                SUM(patent_count) as patents_count,
                SUM(total_scholars) as phd_count,
                MAX(w_pub) as w_pub,
                MAX(w_cit) as w_cit,
                MAX(w_pat) as w_pat,
                MAX(w_fund) as w_fund,
                MAX(w_phd) as w_phd,
                ROUND(AVG(norm_pub), 1) as avg_norm_pub,
                ROUND(AVG(norm_cit), 1) as avg_norm_cit,
                ROUND(AVG(norm_pat), 1) as avg_norm_pat,
                ROUND(AVG(norm_fund), 1) as avg_norm_fund,
                ROUND(AVG(norm_phd), 1) as avg_norm_phd
            FROM v_step3b_scoring_engine
        """
        params = []
        if dept_code:
            query += " WHERE dept_code = %s"
            params.append(dept_code)
            
        query += " GROUP BY dept_code, dept_name ORDER BY dept_code;"
        cur.execute(query, tuple(params))
        dept_rows = cur.fetchall()
        
        # Get top researcher for each department
        cur.execute("""
            SELECT dept_code, employee_no, full_name, final_score
            FROM v_step3b_scoring_engine
            WHERE dept_rank = 1;
        """)
        top_researchers = {r["dept_code"]: r for r in cur.fetchall()}
        
        results = []
        for d in dept_rows:
            code = d["dept_code"]
            top_r = top_researchers.get(code)
            results.append({
                "code": code,
                "name": d["dept_name"],
                "faculty_count": int(d["faculty_count"]),
                "mean_score": float(d["mean_score"]),
                "median_score": float(d["median_score"]),
                "top_score": float(d["top_score"]),
                "total_pubs": int(d["total_pubs"]),
                "q1_percentage": float(d["q1_percentage"]) if d["q1_percentage"] is not None else 0.0,
                "total_cits": int(d["total_cits"]),
                "total_funding_lakhs": float(d["total_funding_lakhs"]),
                "patents_count": int(d["patents_count"]),
                "phd_count": int(d["phd_count"]),
                "weights": {
                    "publication": float(d["w_pub"]),
                    "citation": float(d["w_cit"]),
                    "patents": float(d["w_pat"]),
                    "funding": float(d["w_fund"]),
                    "phd": float(d["w_phd"]),
                    "weight_sum": 1.000
                },
                "benchmark_pillars": {
                    "publication_quality": float(d["avg_norm_pub"]),
                    "citation_impact": float(d["avg_norm_cit"]),
                    "patents": float(d["avg_norm_pat"]),
                    "funding": float(d["avg_norm_fund"]),
                    "phd_supervision": float(d["avg_norm_phd"])
                },
                "top_researcher": {
                    "employee_no": top_r["employee_no"],
                    "name": top_r["full_name"],
                    "score": float(top_r["final_score"])
                } if top_r else None
            })
            
        return results

def get_institution_overview() -> Dict[str, Any]:
    with get_db_cursor() as cur:
        # 1. Institution branding
        cur.execute("SELECT name, code FROM core.institution LIMIT 1;")
        inst = cur.fetchone()
        inst_name = inst["name"] if inst else "Apex Institute of Technology & Advanced Research"
        inst_code = inst["code"] if inst else "APEX_A20"
        
        # 2. Overall aggregates
        cur.execute("""
            SELECT 
                COUNT(*) AS total_faculty,
                ROUND(AVG(final_score), 1) AS mean_score,
                SUM(total_pubs) AS total_pubs,
                SUM(cits_latest) AS total_citations,
                SUM(patent_count) AS total_patents,
                SUM(total_scholars) AS total_phd
            FROM v_step3b_scoring_engine;
        """)
        fac_stats = cur.fetchone()
        
        # 3. Exact distinct publications & Q1 percentage from research.publication
        cur.execute("""
            SELECT 
                COUNT(DISTINCT p.publication_id) AS total_publications,
                ROUND(COUNT(DISTINCT p.publication_id) FILTER (WHERE vm.quartile = 'Q1')::numeric / 
                      NULLIF(COUNT(DISTINCT p.publication_id), 0) * 100.0, 1) AS q1_percentage
            FROM research.publication p
            LEFT JOIN LATERAL (
                SELECT vm.quartile
                FROM research.venue_metric vm
                WHERE vm.venue_id = p.venue_id
                ORDER BY ABS(vm.metric_year - p.published_year) ASC
                LIMIT 1
            ) vm ON true;
        """)
        pub_stats = cur.fetchone()
        
        # 4. Total grant funding sanctioned
        cur.execute("SELECT ROUND(SUM(sanctioned_amount) / 100000.0, 1) AS total_funding FROM research.project;")
        funding_row = cur.fetchone()
        
        # 5. Active patents
        cur.execute("SELECT COUNT(*) AS active_patents FROM research.patent;")
        patent_row = cur.fetchone()
        
        # 6. Top 5 researchers across institution
        cur.execute("SELECT * FROM v_step3b_scoring_engine ORDER BY inst_rank ASC LIMIT 5;")
        top_researchers = [format_faculty_record(r, include_details=False, cur=cur) for r in cur.fetchall()]
        
        # 7. Department benchmarks
        departments = get_department_benchmarks()
        
        # 8. Annual research trends from database
        cur.execute("""
            WITH years AS (
                SELECT generate_series(2020, 2024) AS yr
            ),
            annual_pubs AS (
                SELECT published_year AS yr, COUNT(*) AS pubs
                FROM research.publication
                GROUP BY published_year
            ),
            annual_funding AS (
                SELECT EXTRACT(YEAR FROM start_date)::int AS yr, ROUND(SUM(sanctioned_amount) / 100000.0, 1) AS funding_lakhs
                FROM research.project
                GROUP BY EXTRACT(YEAR FROM start_date)
            ),
            annual_cits AS (
                SELECT EXTRACT(YEAR FROM as_of_date)::int AS yr, SUM(citation_count) AS cits
                FROM research.citation_snapshot
                WHERE subject_type = 'FACULTY'
                GROUP BY EXTRACT(YEAR FROM as_of_date)
            )
            SELECT 
                y.yr AS year,
                COALESCE(ac.cits, 0) AS citations,
                COALESCE(ap.pubs, 0) AS publications,
                COALESCE(af.funding_lakhs, 0.0) AS funding_lakhs
            FROM years y
            LEFT JOIN annual_pubs ap ON y.yr = ap.yr
            LEFT JOIN annual_funding af ON y.yr = af.yr
            LEFT JOIN annual_cits ac ON y.yr = ac.yr
            ORDER BY y.yr ASC;
        """)
        annual_trends = [
            {
                "year": int(r["year"]),
                "citations": int(r["citations"]),
                "publications": int(r["publications"]),
                "funding_lakhs": float(r["funding_lakhs"])
            }
            for r in cur.fetchall()
        ]
        
        return {
            "institution_name": inst_name,
            "institution_code": inst_code,
            "evaluation_date": "2024-12-31",
            "total_faculty": int(fac_stats["total_faculty"]),
            "mean_score": float(fac_stats["mean_score"]),
            "total_publications": int(pub_stats["total_publications"]),
            "q1_publication_percentage": float(pub_stats["q1_percentage"]),
            "total_grant_funding_lakhs": float(funding_row["total_funding"]),
            "active_patents": int(patent_row["active_patents"]),
            "total_phd_scholars": int(fac_stats["total_phd"]),
            "total_citations": int(fac_stats["total_citations"]),
            "departments": departments,
            "top_researchers": top_researchers,
            "annual_trends": annual_trends
        }
