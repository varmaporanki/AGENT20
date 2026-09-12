# Agent 20 — Core Analytics, Weighting & Normalization Design (Revised)

This document details the mathematical, bibliometric, and statistical design of the **Agent 20 Research Productivity Scoring Engine**, updated to reflect the Step 3B architectural review specifications.

---

## 1. Goals

The primary objective of the Agent 20 Scoring Engine is to provide an **objective, deterministic, explainable, and audit-ready** evaluation of faculty research performance on a continuous **0–100 scale**.

### Key Architectural Principles:
1. **Deterministic Calculation**: All numerical scores are computed deterministically via relational algebra in PostgreSQL. The Large Language Model (Groq/OpenAI) **never calculates or hallucinates numerical scores**; its role in downstream steps is strictly to synthesize human-readable narratives grounded in structured calculation evidence.
2. **Reproducible Evaluation Date**: All date-sensitive metrics (faculty experience, career stage eligibility, point-in-time citation snapshots, and annual momentum) are calculated relative to a single configurable parameter: `DATE '2024-12-31'`.
3. **Discipline-Specific Dynamic Weights**: Weight allocations are dynamically adjusted when a discipline lacks a structural research output (such as patents in Humanities & Social Sciences), guaranteeing an auditable 100% composite scale across every department.
4. **Quality Over Quantity**: Publication volume is heavily subordinated to venue quartile rigor, indexing status, and verified author contribution.
5. **Career-Stage Startup Recognition**: Early-career faculty (Assistant Professors) receive a bounded velocity multiplier rather than being penalized for lacking 20 years of accumulated stock.
6. **Workload Context**: Research productivity achieved under heavy instructional contact hours and institutional administrative duties receives bounded recognition without substituting for research.
7. **Anti-Gaming Architecture**: Multiple defensive safeguards prevent manipulation through volume farming, middle-author inflation, or predatory publishing.

---

## 2. Metric Definitions

All metrics strictly map to verified physical database columns in `acadagents`:

| Metric Code | Metric Name | Source Table(s) | Description |
| :--- | :--- | :--- | :--- |
| $M_1$ | **Publication Volume ($N_{\text{pub}}$)** | `research.publication_author`, `research.publication` | Total distinct verified publications authored |
| $M_2$ | **Venue Tier ($Q$)** | `research.venue_metric` | Quartile classification (`Q1`, `Q2`, `Q3`, `Q4`) |
| $M_3$ | **Indexing Status ($I_{\text{idx}}$)** | `research.venue_metric` | Peer-reviewed indexing flag in Scopus / Web of Science |
| $M_4$ | **Authorship Position ($\alpha$)** | `research.publication_author` | `author_order` and `is_corresponding` status |
| $M_5$ | **Flagged / Predatory ($F_{\text{flag}}$)** | `research.venue` | Journal integrity flag (`is_flagged = true`) |
| $M_6$ | **Cumulative Citations ($C_{\text{latest}}$)** | `research.citation_snapshot` | Cumulative point-in-time citations as of `eval_date` (`2024-12-31`) |
| $M_7$ | **Citation Momentum ($\Delta C$)** | `research.citation_snapshot` | Annual citations gained ($C_{2024} - C_{2023}$) |
| $M_8$ | **H-Index ($H$)** | `research.citation_snapshot` | Current Hirsch index as of `eval_date` |
| $M_9$ | **i10-Index ($I_{10}$)** | `research.citation_snapshot` | Publications with $\ge 10$ citations as of `eval_date` |
| $M_{10}$ | **Patent Portfolio ($N_{\text{pat}}$)** | `research.patent`, `research.patent_inventor` | Status (`GRANTED`, `PUBLISHED`, `FILED`) and inventor share |
| $M_{11}$ | **Sponsored Funding ($F_{\text{fund}}$)** | `research.project`, `research.project_member` | Sanctioned grant amounts in Lakhs INR (PI and Co-PI roles) |
| $M_{12}$ | **PhD Guidance ($N_{\text{phd}}$)** | `research.phd_scholar` | Doctoral candidates (`AWARDED`, `SUBMITTED`, `RESEARCH`) |
| $M_{13}$ | **Instructional Contact ($H_{\text{teach}}$)** | `hr.faculty_workload` | Weekly scheduled lecture, laboratory, and tutorial hours |
| $M_{14}$ | **Administrative Duty ($H_{\text{admin}}$)** | `hr.faculty_workload`, `hr.admin_role_assignment` | Weekly allocated executive load (HOD, Dean, Warden) |
| $M_{15}$ | **Workload Variance ($V_{\text{workload}}$)** | `hr.faculty_workload` | Percentage workload load variance relative to norm |
| $M_{16}$ | **Years of Service ($T_{\text{exp}}$)** | `people.faculty` | Fractional active years from `date_of_joining` to `eval_date` |

---

## 3. Mathematical Formulas

### A. Raw Publication Pillar ($R_{\text{pub}}$)
For each publication $p \in P_i$ authored by faculty member $i$:
$$R_{\text{pub}, i} = \sum_{p \in P_i} w_Q(p) \times \alpha(p, i)$$

### B. Raw Citation Pillar ($R_{\text{cit}}$)
Verified semantic: `citation_snapshot.citation_count` is cumulative point-in-time as of `as_of_date`.
Annual momentum is computed as $\Delta C_i = \max(0, C_{2024, i} - C_{2023, i})$.
Logarithmic damping prevents power-law outlier domination:
$$R_{\text{cit}, i} = 4.0 \cdot \ln(1 + C_{\text{latest}, i}) + 3.0 \cdot H_i + 1.0 \cdot I_{10, i} + 2.0 \cdot \ln(1 + \max(0, \Delta C_i))$$

### C. Raw Patent Pillar ($R_{\text{pat}}$)
$$R_{\text{pat}, i} = \sum_{pt \in \text{Patents}_i} w_{\text{pat}}(pt) \times \text{ownership\_share}(pt, i) \times \theta_{\text{order}}(pt, i)$$
Where $\theta_{\text{order}} = 1.0$ for lead inventor (`inventor_order = 1`) and $0.8$ for co-inventors.

### D. Raw Funding Pillar ($R_{\text{fund}}$)
Sanctioned grant amounts are scaled logarithmically in units of Lakhs INR ($\text{Amount} / 100,000$):
$$R_{\text{fund}, i} = \sum_{pr \in \text{PI\_Projects}_i} 5.0 \cdot \ln\left(1 + \frac{\text{SanctionedINR}}{100,000}\right) + \sum_{pr \in \text{CoPI\_Projects}_i} 2.5 \cdot \ln\left(1 + \frac{\text{SanctionedINR}}{100,000}\right)$$

### E. Raw PhD Guidance Pillar ($R_{\text{phd}}$)
$$R_{\text{phd}, i} = \sum_{s \in \text{Scholars}_i} w_{\text{phd}}(s) \times \begin{cases} 1.0 & \text{if primary supervisor} \\ 0.5 & \text{if co-supervisor} \end{cases}$$

---

## 4. Component Weights & Discipline Re-weighting

The scoring engine implements **auditable, discipline-specific dynamic weighting** calculated in SQL:

| Department / Discipline | Publication ($w_{\text{pub}}$) | Citations ($w_{\text{cit}}$) | Patents ($w_{\text{pat}}$) | Funding ($w_{\text{fund}}$) | PhD Guidance ($w_{\text{phd}}$) | Weight Sum |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **CSE (Computer Science)** | **35%** (0.35) | **25%** (0.25) | **15%** (0.15) | **15%** (0.15) | **10%** (0.10) | **1.000 (100%)** |
| **MECH (Mechanical Eng)** | **35%** (0.35) | **25%** (0.25) | **15%** (0.15) | **15%** (0.15) | **10%** (0.10) | **1.000 (100%)** |
| **BIO (Biotechnology)** | **35%** (0.35) | **25%** (0.25) | **15%** (0.15) | **15%** (0.15) | **10%** (0.10) | **1.000 (100%)** |
| **HSS (Humanities & Social Sciences)** | **45%** (0.45) | **30%** (0.30) | **0%** (0.00) | **15%** (0.15) | **10%** (0.10) | **1.000 (100%)** |

### Auditable Non-Applicable Pillar Logic:
- A pillar is determined active in department $d$ if $\text{Max}_{k, d} > 0$.
- For HSS, where patents are structurally non-applicable ($\text{Max}_{\text{pat}, \text{HSS}} = 0$), the 15% patent weight is dynamically reallocated: **+10% to Publications (0.45)** and **+5% to Citations (0.30)**.
- The SQL calculates `weight_sum = w_pub + w_cit + w_pat + w_fund + w_phd` and verifies that it equals exactly **1.000** for every department.

---

## 5. Publication-Quality Model

Publication quality is stratified to reward rigorous peer review and penalize low-tier volume farming:

| Venue Classification | Quality Weight ($w_Q$) | Condition in Database | Justification |
| :--- | :---: | :--- | :--- |
| **Q1 Journal / Top Conference** | **10.0** | `quartile = 'Q1'` AND `is_indexed = true` | Top 25% international impact in subdiscipline |
| **Q2 Journal** | **6.0** | `quartile = 'Q2'` AND `is_indexed = true` | High-impact international peer review |
| **Q3 Journal** | **3.0** | `quartile = 'Q3'` AND `is_indexed = true` | Standard indexed peer-reviewed venue |
| **Q4 Journal** | **1.5** | `quartile = 'Q4'` AND `is_indexed = true` | Emerging or lower-tier indexed journal |
| **Indexed Proceedings / Unranked** | **2.0** | `is_indexed = true` AND `quartile IS NULL` | Verified Scopus/WoS conference or symposium |
| **Unindexed / Non-Peer-Reviewed** | **0.5** | `is_indexed IS NOT TRUE` AND NOT `is_flagged` | Nominal non-indexed publication |
| **Flagged / Predatory Venue** | **0.0** | `is_flagged = true` | **Zero credit**. Flagged for integrity violation. |

---

## 6. Authorship Contribution Model

To reward scientific leadership without double-counting:

$$\alpha(p, i) = \begin{cases} 
1.00 & \text{if } \text{is\_first} \land \text{is\_corresponding} \quad (\text{Sole / Primary Lead Investigator}) \\
0.85 & \text{if } \text{is\_first} \land \neg\text{is\_corresponding} \quad (\text{Lead Experimental Researcher}) \\
0.85 & \text{if } \neg\text{is\_first} \land \text{is\_corresponding} \quad (\text{Senior Intellectual Guarantor / PI}) \\
0.50 & \text{if middle / contributing co-author (order } \ge 2)
\end{cases}$$

---

## 7. Citation Model & Verified Semantics

### Verification of Citation Count Semantics:
Inspection of `research.citation_snapshot` confirms that `citation_count` represents a **cumulative point-in-time snapshot as of `as_of_date`**:
1. For faculty with multi-year snapshots (e.g. `EMP0001`), citations monotonically increase: `870` (2022) $\rightarrow$ `1160` (2023) $\rightarrow$ `1450` (2024).
2. Correspondingly, `h_index` monotonically increases: `16` $\rightarrow$ `17` $\rightarrow$ `18`.
3. Therefore, annual momentum for 2024 is mathematically confirmed as:
   $$\Delta C = C_{\text{latest}} - C_{\text{prior}} = C_{2024-12-31} - C_{2023-12-31}$$
   If prior snapshot is absent, $\Delta C = 0$.

---

## 8. Discipline Normalization & Zero-Variance Safeguard

1. **Max-Relative Benchmark Scaling**:
   $$S_{k, i} = \left(\frac{R_{k, i}}{\text{Max}_{k, d}}\right) \times 100.0$$
2. **Zero-Variance Safeguard**:
   When all faculty in a department share identical baseline values ($\text{Max}_{k, d} = \text{Min}_{k, d}$), standard min-max produces division by zero, while naive department-max scaling would artificially award everyone 100 points.
   **Solution**: The engine falls back to the **institutional global maximum** ($\text{GlobalMax}_k$):
   $$S_{k, i} = \left(\frac{R_{k, i}}{\text{GlobalMax}_k}\right) \times 100.0$$
   In HSS, where all faculty have baseline citations, this awards them a calibrated baseline score (37.7 points) instead of an artificial 100.

---

## 9. Career-Stage Adjustment

Evaluated relative to `eval_date`:
$$A_{\text{stage}, i} = \begin{cases}
1.20 & \text{if Assistant Professor and } T_{\text{exp}} \le 5.0 \text{ years (early-career startup lag)} \\
1.10 & \text{if Assistant Professor and } T_{\text{exp}} > 5.0 \text{ years} \\
1.05 & \text{if Associate Professor and } T_{\text{exp}} \le 10.0 \text{ years} \\
1.00 & \text{otherwise (Senior Professor / full career tenure)}
\end{cases}$$
* **Multiplicative Guarantee**: Multiplies earned research score ($1.20 \times S_{\text{base}}$). Inactive faculty receive $1.20 \times 0 = 0$.

---

## 10. Workload Adjustment

Calculated from average workload variance $\bar{V}_i$ over evaluated terms:
$$M_{\text{load}, i} = 1.00 + \min\left(0.15, \max\left(0.0, \frac{\bar{V}_i}{100.0} \times 0.15\right)\right)$$

### Continuous Linear Ramp:
- A variance of **36% does NOT equal +15%**.
- Rather, a variance of 36% yields:
  $$M_{\text{load}} = 1.00 + \left(\frac{36.0}{100.0} \times 0.15\right) = 1.054 \quad (+5.4\%)$$
- The +15% value ($1.150$) is strictly the **upper cap**, reached only at $\bar{V} \ge 100\%$ (e.g. Dr. Vikramaditya Singh bearing 36 hours/week as Dean + HOD against an 18-hour norm).

---

## 11. Final 0–100 Formula

1. **Discipline-Normalized Base Score**:
   $$S_{\text{base}, i} = w'_p S_{\text{pub}} + w'_c S_{\text{cit}} + w'_t S_{\text{pat}} + w'_f S_{\text{fund}} + w'_h S_{\text{phd}}$$
2. **Combined Context Factor**:
   $$C_{\text{adj}, i} = \min(1.30, A_{\text{stage}, i} \times M_{\text{load}, i})$$
3. **Final Research Productivity Score**:
   $$\text{FinalScore}_i = \min\left(100.0, \max\left(0.0, \text{ROUND}(S_{\text{base}, i} \times C_{\text{adj}, i}, 1)\right)\right)$$

---

## 12. Dynamic Explainability Model

All explainability JSON records are generated dynamically in SQL without hardcoded numbers:

```json
{
  "name": "Dr. Ananya Sharma",
  "evidence": [
    "4 total publications authored (4 in Q1/Q2, 0 unindexed/predatory)",
    "Principal Investigator on 1 grant(s) with 173.0 Lakhs INR sanctioned",
    "Career stage factor: 1.20 for ASSISTANT_PROFESSOR with 3.3 years experience as of 2024-12-31"
  ],
  "components": {
    "funding": 100.0,
    "patents": 0.0,
    "citation_impact": 41.2,
    "phd_supervision": 0.0,
    "publication_quality": 57.1
  },
  "department": "CSE",
  "employee_no": "EMP0003",
  "final_score": 57.1,
  "applied_weights": {
    "phd_weight": 0.10,
    "weight_sum": 1.00,
    "patent_weight": 0.15,
    "funding_weight": 0.15,
    "citation_weight": 0.25,
    "publication_weight": 0.35
  },
  "rank_within_department": 3,
  "rank_institution": 10
}
```

---

## 13. Actual Computed Test-Case Results

Generated directly from [`data/step3b_scoring_prototype.sql`](file:///c:/agent20/data/step3b_scoring_prototype.sql) using `eval_date = DATE '2024-12-31'`:

| Metric / Attribute | Case A (`EMP0002`) Dr. Rajesh Kumar | Case B (`EMP0003`) Dr. Ananya Sharma | Case C (`EMP0007`) Dr. Vikramaditya Singh | Case D (`EMP0014`) Dr. Sneha Patel |
| :--- | :---: | :---: | :---: | :---: |
| **Department** | CSE | CSE | MECH | BIO |
| **Designation** | Associate Professor | Assistant Professor | Professor | Assistant Professor |
| **Evaluation Date** | 2024-12-31 | 2024-12-31 | 2024-12-31 | 2024-12-31 |
| **Experience (Years)** | 8.4 | 3.3 | 18.4 | 3.0 |
| **Raw Publications** | 14.5 (10 papers, 0 Q1, 4 low) | 40.0 (4 papers, 4 Q1) | 23.0 (3 papers, 2 Q1) | 70.0 (9 papers, 4 Q1, 5 Q2) |
| **Raw Citations** | 36.6 (85 cits, h-index 3) | 48.4 (320 cits, h-index 4) | 52.0 (250 cits, h-index 5) | 58.9 (410 cits, h-index 6) |
| **Raw Patents** | 0.0 | 0.0 | 5.0 (1 patent) | 0.0 |
| **Raw Funding** | 0.0 | 31.5 (SERB 48L) | 28.2 (Co-PI grant) | 31.9 (DBT 55L) |
| **Raw PhD Guidance** | 0.0 | 0.0 | 3.0 (1 scholar) | 0.0 |
| **Normalized Pubs** | 20.7 | 57.1 | 16.4 | 100.0 |
| **Normalized Citations**| 31.2 | 41.2 | 37.7 | 47.5 |
| **Normalized Patents** | 0.0 | 0.0 | 25.0 | 0.0 |
| **Normalized Funding** | 0.0 | 100.0 | 100.0 | 100.0 |
| **Normalized PhD** | 0.0 | 0.0 | 18.8 | 0.0 |
| **Applied Weights** | 35% / 25% / 15% / 15% / 10% | 35% / 25% / 15% / 15% / 10% | 35% / 25% / 15% / 15% / 10% | 35% / 25% / 15% / 15% / 10% |
| **Base Research Score**| **15.0** | **45.3** | **35.8** | **61.9** |
| **Workload Variance** | 22.2% | 33.3% | 100.0% (Severe, 36 hrs) | 33.3% |
| **Workload Multiplier**| 1.033 | 1.050 | 1.150 (+15.0% max cap) | 1.050 |
| **Career Stage Factor**| 1.05 (Assoc $\le 10$ yrs) | 1.20 (Asst $\le 5$ yrs) | 1.00 (Senior Professor) | 1.20 (Asst $\le 5$ yrs) |
| **Combined Factor** | 1.085 | 1.260 | 1.150 | 1.260 |
| **Final Score** | **16.3** | **57.1** | **41.2** | **78.0** |
| **Department Rank** | **6 / 6** | **3 / 6** | **3 / 6** | **2 / 6** |
| **Institution Rank** | **19 / 24** | **10 / 24** | **13 / 24** | **6 / 24** |

---

## 14. Determinism & Join Isolation Guarantees

1. **Independent Pre-Aggregation**: Every dimension (publications, citations, patents, PI projects, Co-PI projects, PhD scholars, and workload) is pre-aggregated in separate CTEs. Zero metrics multiply as a result of joins.
2. **Determinism Verification**: Two successive executions of the scoring SQL produce **100% identical outputs** (byte-for-byte verified via diff).
3. **Date Sensitivity**: Modifying `evaluation_date` alters experience and career-stage eligibility predictably across calendar boundaries.

---

## 15. Known Limitations & Operational Context

> [!IMPORTANT]
> **Operational Scope Notice**:
> This scoring engine is designed as an **explainable hackathon research productivity prototype**, not an institutional HR policy or permanent promotion rubric.

1. **Evaluation Date Anchor**: Current prototype calculations anchor strictly to `eval_date = DATE '2024-12-31'`.
2. **Department Cohort Size ($N = 6$)**: In the synthetic dataset, each department has 6 faculty members. Departmental maximum benchmarks reflect this small sample size. In an enterprise deployment ($N \ge 30$), 90th-percentile scaling or institutional standard thresholds are recommended.
3. **Max-Relative Normalization**: Max-relative normalization within department is a prototype strategy suitable for controlled demonstration; production systems should calibrate against external national bibliometric norms.
4. **Venue Metrics Time Horizon**: Synthetic venue metrics are available for calendar years 2022, 2023, and 2024; pre-2022 publications utilize nearest-year lateral matching.
5. **Citation History Depth**: Citation tracking covers 2022–2024; annual momentum reflects the 2023–2024 delta.
6. **Bounded Context Adjustments**: Workload recognition is capped at +15%, and total combined context adjustments are capped at +30% to prevent non-research factors from overwhelming scholarship.
