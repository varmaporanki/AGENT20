"""
Authoritative Step 3B Scoring SQL Loader
Reads directly from data/step3b_scoring_prototype.sql lines 18-475
"""
import os

def get_scoring_view_sql() -> str:
    # Path relative to project root
    sql_path = os.path.join(os.path.dirname(__file__), "..", "data", "step3b_scoring_prototype.sql")
    if not os.path.exists(sql_path):
        sql_path = os.path.abspath(os.path.join("data", "step3b_scoring_prototype.sql"))
    
    with open(sql_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Extract lines 18 to 475 (0-indexed: 17 to 475)
    view_sql = "".join(lines[17:475])
    return view_sql
