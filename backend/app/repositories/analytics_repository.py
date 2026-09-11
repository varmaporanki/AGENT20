"""
Analytics repository executing the authoritative PostgreSQL scoring engine query.
Strictly relies on PostgreSQL relational algebra for all deterministic scoring calculations.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from app.db import get_db_connection

logger = logging.getLogger("agent20.repository")

_SQL_DIR = Path(__file__).resolve().parent.parent / "sql"
_SCORING_SQL_PATH = _SQL_DIR / "scoring_engine.sql"


def _load_scoring_sql() -> str:
    """Loads the authoritative Step 3B scoring SQL template."""
    with open(_SCORING_SQL_PATH, "r", encoding="utf-8") as f:
        return f.read()


_SCORING_SQL = _load_scoring_sql()


class AnalyticsRepository:
    """Executes deterministic Agent 20 scoring and analytics queries."""

    def __init__(self, sql_query: Optional[str] = None):
        self.sql_query = sql_query or _SCORING_SQL

    def get_all_scored_faculty(self, eval_date: str) -> List[Dict[str, Any]]:
        """
        Executes the Step 3B deterministic scoring engine in PostgreSQL.
        Returns a list of all faculty evaluation records.
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(self.sql_query, (eval_date,))
                rows = cur.fetchall()
                # Normalize row values (convert UUIDs, decimals to float)
                return [self._normalize_row(r) for r in rows]

    def get_faculty_by_employee_no(
        self, employee_no: str, eval_date: str
    ) -> Optional[Dict[str, Any]]:
        """
        Fetches the complete evaluation record for a single faculty member.
        Wraps the scoring CTE and filters strictly by employee_no.
        """
        query = f"""
        WITH scored_all AS (
            {self.sql_query}
        )
        SELECT * FROM scored_all
        WHERE UPPER(employee_no) = UPPER(%s)
        LIMIT 1;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (eval_date, employee_no.strip()))
                row = cur.fetchone()
                return self._normalize_row(row) if row else None

    def get_rankings(
        self, eval_date: str, department_code: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves institutional or departmental rankings.
        """
        if department_code:
            query = f"""
            WITH scored_all AS (
                {self.sql_query}
            )
            SELECT * FROM scored_all
            WHERE UPPER(dept_code) = UPPER(%s)
            ORDER BY dept_rank ASC, final_score DESC, total_pubs DESC;
            """
            params = (eval_date, department_code.strip())
        else:
            query = f"""
            WITH scored_all AS (
                {self.sql_query}
            )
            SELECT * FROM scored_all
            ORDER BY inst_rank ASC, final_score DESC, total_pubs DESC;
            """
            params = (eval_date,)

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)
                rows = cur.fetchall()
                return [self._normalize_row(r) for r in rows]

    def get_departments_summary(self, eval_date: str) -> List[Dict[str, Any]]:
        """
        Aggregates departmental analytics across all departments.
        """
        query = f"""
        WITH scored_all AS (
            {self.sql_query}
        )
        SELECT 
            dept_code,
            dept_name,
            COUNT(*) AS faculty_count,
            ROUND(AVG(final_score), 1) AS average_score,
            MAX(final_score) AS top_score,
            bool_or(has_patents) AS has_patents,
            MAX(w_pub) AS w_pub,
            MAX(w_cit) AS w_cit,
            MAX(w_pat) AS w_pat,
            MAX(w_fund) AS w_fund,
            MAX(w_phd) AS w_phd,
            MAX(weight_sum) AS weight_sum
        FROM scored_all
        GROUP BY dept_code, dept_name
        ORDER BY dept_code ASC;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (eval_date,))
                rows = cur.fetchall()
                return [self._normalize_row(r) for r in rows]

    def get_department_faculty_and_benchmarks(
        self, department_code: str, eval_date: str
    ) -> Optional[Dict[str, Any]]:
        """
        Fetches department faculty ranked list, summary aggregates, and pillar benchmarks.
        """
        query_faculty = f"""
        WITH scored_all AS (
            {self.sql_query}
        )
        SELECT * FROM scored_all
        WHERE UPPER(dept_code) = UPPER(%s)
        ORDER BY dept_rank ASC, final_score DESC, total_pubs DESC;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query_faculty, (eval_date, department_code.strip()))
                faculty_rows = cur.fetchall()
                if not faculty_rows:
                    return None

                norm_faculty = [self._normalize_row(r) for r in faculty_rows]

                # Compute benchmarks from the SQL rows
                max_pub = max((f["raw_pub"] for f in norm_faculty), default=0.0)
                min_pub = min((f["raw_pub"] for f in norm_faculty), default=0.0)
                max_cit = max((f["raw_cit"] for f in norm_faculty), default=0.0)
                min_cit = min((f["raw_cit"] for f in norm_faculty), default=0.0)
                max_pat = max((f["raw_pat"] for f in norm_faculty), default=0.0)
                min_pat = min((f["raw_pat"] for f in norm_faculty), default=0.0)
                max_fund = max((f["raw_fund"] for f in norm_faculty), default=0.0)
                min_fund = min((f["raw_fund"] for f in norm_faculty), default=0.0)
                max_phd = max((f["raw_phd"] for f in norm_faculty), default=0.0)
                min_phd = min((f["raw_phd"] for f in norm_faculty), default=0.0)

                first = norm_faculty[0]
                avg_score = round(sum(f["final_score"] for f in norm_faculty) / len(norm_faculty), 1)

                return {
                    "department_code": first["dept_code"],
                    "department_name": first["dept_name"],
                    "faculty_count": len(norm_faculty),
                    "average_score": avg_score,
                    "top_score": max((f["final_score"] for f in norm_faculty), default=0.0),
                    "has_patents": first["has_patents"],
                    "w_pub": first["w_pub"],
                    "w_cit": first["w_cit"],
                    "w_pat": first["w_pat"],
                    "w_fund": first["w_fund"],
                    "w_phd": first["w_phd"],
                    "weight_sum": first["weight_sum"],
                    "benchmarks": {
                        "max_raw_publication": float(max_pub),
                        "min_raw_publication": float(min_pub),
                        "max_raw_citation": float(max_cit),
                        "min_raw_citation": float(min_cit),
                        "max_raw_patent": float(max_pat),
                        "min_raw_patent": float(min_pat),
                        "max_raw_funding": float(max_fund),
                        "min_raw_funding": float(min_fund),
                        "max_raw_phd": float(max_phd),
                        "min_raw_phd": float(min_phd),
                    },
                    "faculty": norm_faculty,
                }

    @staticmethod
    def _normalize_row(row: Dict[str, Any]) -> Dict[str, Any]:
        """Converts database-specific types (UUID, Decimal) to JSON-serializable primitives."""
        clean = {}
        for k, v in row.items():
            if hasattr(v, "is_finite") or type(v).__name__ == "Decimal":
                clean[k] = float(v)
            elif hasattr(v, "hex"):  # UUID
                clean[k] = str(v)
            elif hasattr(v, "isoformat"):  # Date
                clean[k] = v.isoformat()
            else:
                clean[k] = v
        return clean
