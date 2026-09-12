"""
AI Research Assistant Engine
Grounds answers strictly in database evidence and the Step 3B scoring model.
Powered by multi-provider LLM synthesis (Groq primary -> OpenAI fallback).
"""
import os
import re
import json
from typing import Dict, Any, Optional
from .services import (
    get_all_faculty,
    get_faculty_by_id_or_code,
    get_department_benchmarks,
    get_institution_overview
)
from .ai_provider import ai_service, AllProvidersUnavailableError

SYSTEM_INSTRUCTION = (
    "You are the Agent 20 Academic Research Intelligence Assistant for Apex Institute of "
    "Technology & Advanced Research.\n"
    "Your objective is to provide executive, analytically precise, and evidence-grounded answers "
    "to university leadership, deans, and faculty.\n\n"
    "CRITICAL GOVERNANCE RULES:\n"
    "1. STRICT GROUNDING: All numerical facts supplied in the context are authoritative PostgreSQL values. "
    "Do not calculate, modify, reinterpret, or invent numerical metrics. Explain only the supplied evidence.\n"
    "2. NO FABRICATION: NEVER calculate, modify, extrapolate, or invent numerical metrics, "
    "names, ranks, or percentages.\n"
    "3. NARRATIVE ROLE: Your role is strictly to synthesize, explain, and contextualize the provided "
    "database metrics in a clear, executive markdown format.\n"
    "4. UNKNOWN DATA: If the requested information is not present in the provided database records, "
    "explicitly state that the data is not recorded in the authoritative system."
)


def synthesize_llm_narrative(
    question: str,
    entity_type: str,
    key_findings: list,
    evidence: list,
    supporting_data: dict,
    fallback_template: str
) -> tuple[str, str]:
    """
    Calls the AI multi-provider fallback engine (Groq -> OpenAI).
    Returns (narrative_text, provider_name).
    """
    user_prompt = (
        f"User Query: {question}\n\n"
        f"Context Entity: {entity_type}\n\n"
        f"Authoritative PostgreSQL Records:\n"
        f"- Key Findings: {json.dumps(key_findings, indent=2)}\n"
        f"- Auditable Evidence: {json.dumps(evidence, indent=2)}\n"
        f"- Underlying Metrics: {json.dumps(supporting_data, indent=2, default=str)}\n\n"
        "Synthesize a well-structured, executive response directly answering the user query. "
        "Highlight key achievements, context adjustments (career-stage / workload if applicable), "
        "and comparative standing using ONLY the facts provided."
    )

    try:
        result = ai_service.generate_narrative(
            system_prompt=SYSTEM_INSTRUCTION,
            user_prompt=user_prompt
        )
        return result.text, result.provider
    except AllProvidersUnavailableError:
        # Honest fallback if both providers fail
        honest_answer = (
            "*(Notice: AI narrative synthesis is temporarily unavailable across external LLM providers. "
            "Displaying authoritative PostgreSQL research analytics directly:)*\n\n"
            + fallback_template
        )
        return honest_answer, "fallback_database"
    except Exception as e:
        honest_answer = (
            "*(Notice: AI synthesis service encountered an unexpected error. "
            "Displaying authoritative PostgreSQL research analytics directly:)*\n\n"
            + fallback_template
        )
        return honest_answer, "fallback_database"


def handle_assistant_query(
    question: str,
    context_faculty_id: Optional[str] = None,
    context_department: Optional[str] = None
) -> Dict[str, Any]:
    q_lower = question.lower()
    
    # 1. Detect if question targets a specific faculty member
    target_faculty = None
    if context_faculty_id:
        target_faculty = get_faculty_by_id_or_code(context_faculty_id)
        
    if not target_faculty:
        # Search for EMP codes or names in question
        emp_match = re.search(r"emp\d{4}", q_lower)
        if emp_match:
            target_faculty = get_faculty_by_id_or_code(emp_match.group(0).upper())
        else:
            # Check known names
            all_fac = get_all_faculty()["faculty"]
            for f in all_fac:
                surname = f["name"].split()[-1].lower()
                firstname = f["name"].split()[1].lower() if len(f["name"].split()) > 1 else ""
                if surname in q_lower or (firstname and firstname in q_lower):
                    target_faculty = get_faculty_by_id_or_code(f["employee_no"])
                    break

    # 2. Detect if question targets a department
    target_dept = None
    for code in ["CSE", "MECH", "BIO", "HSS"]:
        if code.lower() in q_lower or (context_department and context_department.upper() == code):
            depts = get_department_benchmarks(code)
            if depts:
                target_dept = depts[0]
                break
                
    # 3. Grounded Answer Synthesis
    if target_faculty:
        f = target_faculty
        fallback_template = (
            f"**{f['name']}** ({f['employee_no']}, {f['designation']}) in the **{f['department_name']}** "
            f"holds a final research productivity score of **{f['final_score']} / 100.0**.\n\n"
            f"- **Rankings**: Rank **{f['rank_within_department']} of 6** in {f['department']}, and Institutional Rank **{f['rank_institution']} of 24**.\n"
            f"- **Research Base**: Base score of {f['base_score']} derived from {f['raw_metrics']['total_pubs']} publications "
            f"({f['raw_metrics']['q1_pubs']} in Q1, {f['raw_metrics']['q2_pubs']} in Q2), {f['raw_metrics']['cits_latest']} cumulative citations (h-index {f['raw_metrics']['h_index']}), "
            f"and {f['raw_metrics']['total_sanctioned_lakhs']} Lakhs INR in sponsored funding across {f['raw_metrics']['pi_project_count']} grant(s).\n"
            f"- **Context Adjustments**: Early career stage factor: **{f['workload_context']['career_stage_multiplier']}x** "
            f"({f['experience_years']} years experience evaluated as of {f['evaluation_date']}), and workload multiplier: **{f['workload_context']['workload_multiplier']}x** "
            f"(teaching load {f['workload_context']['teaching_hours']} hrs/wk, admin load {f['workload_context']['administrative_load']} hrs/wk)."
        )
        key_findings = [
            f"Evaluated Final Score: {f['final_score']} (Dept Rank #{f['rank_within_department']}, Inst Rank #{f['rank_institution']})",
            f"Publication Quality: {f['components']['publication_quality']}/100 ({f['raw_metrics']['q1_pubs']} Q1 papers)",
            f"Sponsored Grants: {f['raw_metrics']['total_sanctioned_lakhs']} Lakhs INR ({f['raw_metrics']['pi_project_count']} PI grants)"
        ]
        evidence = f["evidence"]
        supporting_data = {
            "faculty": f["name"],
            "employee_no": f["employee_no"],
            "department": f["department"],
            "designation": f["designation"],
            "final_score": f["final_score"],
            "base_score": f["base_score"],
            "dept_rank": f["rank_within_department"],
            "inst_rank": f["rank_institution"],
            "components": f["components"],
            "weights": f["applied_weights"],
            "raw_metrics": f["raw_metrics"],
            "workload_context": f["workload_context"]
        }
        related_questions = [
            f"What publications has {f['name']} authored?",
            f"How does {f['department']} rank compared to other departments?",
            "How is the career-stage factor calculated?"
        ]

        narrative, provider = synthesize_llm_narrative(
            question=question,
            entity_type=f"Faculty: {f['name']} ({f['employee_no']})",
            key_findings=key_findings,
            evidence=evidence,
            supporting_data=supporting_data,
            fallback_template=fallback_template
        )

        return {
            "answer": narrative,
            "keyFindings": key_findings,
            "evidence": evidence,
            "supportingData": supporting_data,
            "relatedQuestions": related_questions,
            "provider": provider
        }
        
    elif target_dept or "weight" in q_lower or "discipline" in q_lower or "hss" in q_lower:
        d = target_dept or get_department_benchmarks("HSS")[0]
        w = d["weights"]
        fallback_template = (
            f"The **{d['name']} ({d['code']})** evaluation uses auditable discipline-aware weights "
            f"tailored to its scholarly research profile:\n\n"
            f"- **Publications**: {int(w['publication'] * 100)}%\n"
            f"- **Citations & Impact**: {int(w['citation'] * 100)}%\n"
            f"- **Patents / IP**: {int(w['patents'] * 100)}%\n"
            f"- **Sponsored Funding**: {int(w['funding'] * 100)}%\n"
            f"- **PhD Supervision**: {int(w['phd'] * 100)}%\n"
            f"- **Auditable Weight Sum**: exactly **{w['weight_sum']:.3f} (100%)**.\n\n"
            f"In HSS, where patents are structurally non-applicable (Max Patents = 0 in database), "
            f"the 15% patent weight is dynamically reallocated: **+10% to Publications (45%)** and **+5% to Citations (30%)**."
        )
        key_findings = [
            f"Department {d['code']} Mean Score: {d['mean_score']} across {d['faculty_count']} faculty",
            f"Discipline weights: Pubs {int(w['publication']*100)}%, Cits {int(w['citation']*100)}%, Patents {int(w['patents']*100)}%, Funding {int(w['funding']*100)}%, PhD {int(w['phd']*100)}%",
            f"Total Sponsored Funding: {d['total_funding_lakhs']} Lakhs INR, Q1 Publication Rate: {d['q1_percentage']}%"
        ]
        evidence = [
            f"SQL view v_step3b_scoring_engine confirms discipline weight sum = {w['weight_sum']} for {d['code']}",
            f"Database row count: {d['faculty_count']} active faculty members in {d['code']}"
        ]
        supporting_data = {
            "department": d["code"],
            "name": d["name"],
            "faculty_count": d["faculty_count"],
            "weights": d["weights"],
            "mean_score": d["mean_score"],
            "benchmark_pillars": d["benchmark_pillars"],
            "top_researcher": d.get("top_researcher")
        }
        related_questions = [
            "Who is the top researcher in this department?",
            "How does HSS weighting differ from engineering departments?",
            "What is the institutional mean score?"
        ]

        narrative, provider = synthesize_llm_narrative(
            question=question,
            entity_type=f"Department: {d['name']} ({d['code']})",
            key_findings=key_findings,
            evidence=evidence,
            supporting_data=supporting_data,
            fallback_template=fallback_template
        )

        return {
            "answer": narrative,
            "keyFindings": key_findings,
            "evidence": evidence,
            "supportingData": supporting_data,
            "relatedQuestions": related_questions,
            "provider": provider
        }
        
    elif "top" in q_lower or "rank" in q_lower or "leader" in q_lower:
        ov = get_institution_overview()
        top_list = ov["top_researchers"]
        top_desc = "\n".join([
            f"{i+1}. **{f['name']}** ({f['department']}) — Score: **{f['final_score']}** (Rank #{f['rank_institution']})"
            for i, f in enumerate(top_list)
        ])
        fallback_template = (
            f"The top-ranked researchers across the institution, derived deterministically from the PostgreSQL scoring engine, are:\n\n"
            f"{top_desc}\n\n"
            f"Institutional mean score is **{ov['mean_score']}** across all {ov['total_faculty']} active faculty members."
        )
        key_findings = [
            f"Top Researcher: {top_list[0]['name']} ({top_list[0]['department']}) with score {top_list[0]['final_score']}",
            f"Total Active Faculty Evaluated: {ov['total_faculty']}",
            f"Institutional Mean Score: {ov['mean_score']}"
        ]
        evidence = [
            "Top 5 rankings calculated by DENSE_RANK() OVER (ORDER BY final_score DESC, total_pubs DESC)",
            f"Total publications evaluated: {ov['total_publications']} ({ov['q1_publication_percentage']}% in Q1 journals)"
        ]
        supporting_data = {
            "top_researchers": [{"name": f["name"], "score": f["final_score"], "dept": f["department"], "rank": f["rank_institution"]} for f in top_list],
            "mean_score": ov["mean_score"],
            "total_faculty": ov["total_faculty"]
        }
        related_questions = [
            f"Why is {top_list[0]['name']} ranked #1?",
            "How do early-career faculty compete against senior professors?",
            "What is the average score by department?"
        ]

        narrative, provider = synthesize_llm_narrative(
            question=question,
            entity_type="Institutional Rankings & Top Researchers",
            key_findings=key_findings,
            evidence=evidence,
            supporting_data=supporting_data,
            fallback_template=fallback_template
        )

        return {
            "answer": narrative,
            "keyFindings": key_findings,
            "evidence": evidence,
            "supportingData": supporting_data,
            "relatedQuestions": related_questions,
            "provider": provider
        }
        
    else:
        # General Institutional Research Intelligence Summary
        ov = get_institution_overview()
        fallback_template = (
            f"**{ov['institution_name']}** Research Productivity Intelligence Summary:\n\n"
            f"- **Faculty**: {ov['total_faculty']} active faculty across 4 departments (CSE, MECH, BIO, HSS)\n"
            f"- **Institutional Mean Score**: **{ov['mean_score']} / 100.0**\n"
            f"- **Scholarly Output**: {ov['total_publications']} publications with **{ov['q1_publication_percentage']}% in Q1 tier venues**\n"
            f"- **Sponsored Grants**: **{ov['total_grant_funding_lakhs']} Lakhs INR** total sanctioned funding\n"
            f"- **Intellectual Property**: {ov['active_patents']} patent disclosures\n"
            f"- **Doctoral Guidance**: {ov['total_phd_scholars']} doctoral candidates registered/awarded\n\n"
            f"All metrics are calculated deterministically relative to evaluation date **{ov['evaluation_date']}**."
        )
        key_findings = [
            f"Institutional Mean Research Score: {ov['mean_score']} / 100.0",
            f"Q1 Publication Rigor: {ov['q1_publication_percentage']}% of all published papers",
            f"Total Research Grants Sanctioned: {ov['total_grant_funding_lakhs']} Lakhs INR"
        ]
        evidence = [
            "Grounded in 21-schema PostgreSQL acadagents database",
            f"Scoring executed via v_step3b_scoring_engine as of {ov['evaluation_date']}"
        ]
        supporting_data = {
            "institution_name": ov["institution_name"],
            "total_faculty": ov["total_faculty"],
            "mean_score": ov["mean_score"],
            "total_publications": ov["total_publications"],
            "q1_percentage": ov["q1_publication_percentage"],
            "total_funding_lakhs": ov["total_grant_funding_lakhs"],
            "active_patents": ov["active_patents"],
            "total_phd": ov["total_phd_scholars"]
        }
        related_questions = [
            "Who are the top researchers across the institution?",
            "How does discipline re-weighting work for HSS?",
            "What is the ranking of faculty in Computer Science?"
        ]

        narrative, provider = synthesize_llm_narrative(
            question=question,
            entity_type="Apex Institute Institutional Overview",
            key_findings=key_findings,
            evidence=evidence,
            supporting_data=supporting_data,
            fallback_template=fallback_template
        )

        return {
            "answer": narrative,
            "keyFindings": key_findings,
            "evidence": evidence,
            "supportingData": supporting_data,
            "relatedQuestions": related_questions,
            "provider": provider
        }
