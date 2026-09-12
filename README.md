# Agent 20 — Research Productivity Agent

An explainable, deterministic, and evidence-grounded research analytics platform built for the **Academic Agent Platform**.

Agent 20 evaluates and benchmarks faculty research performance across publications, citation impact, patent disclosures, external grant mobilization, and doctoral scholar guidance while providing rigorous discipline normalization, career-stage equity, and instructional/administrative workload recognition.

---

## 🏛️ System Architecture

* **Database Engine**: PostgreSQL 16
* **Database Name**: `acadagents`
* **Schema Topology**: 21 relational schemas (`core`, `people`, `research`, `hr`, `academics`, `governance`, `curriculum`, `identity`, `agentops`, etc.)
* **Design Philosophy**: Deterministic analytics computed in relational SQL; LLM (Groq / OpenAI fallback) strictly generates evidence-grounded narratives from structured SQL evaluation records without calculating or inventing scores.

---

## 📂 Repository Structure

```text
AGENT20/
├── data/
│   ├── schema_full.sql                 # Authoritative 21-schema academic platform definition
│   ├── seed_agent20.sql                # Deterministic & idempotent synthetic dataset
│   ├── validate_agent20.sql            # Database validation & integrity check suite
│   ├── step3_mapping_validation.sql    # Step 3A data mapping test queries
│   └── step3b_scoring_prototype.sql    # Step 3B core scoring engine & test cases prototype
├── docs/
│   ├── STEP1_DATABASE_AUDIT.md         # Database schema audit and feasibility analysis
│   ├── STEP2_DATABASE_SETUP.md         # PostgreSQL provisioning and seed design report
│   ├── STEP3_ANALYTICS_DATA_MAPPING.md # Exact field mapping to relational columns
│   └── STEP3B_SCORING_MODEL.md         # Mathematical formulas, weighting, and test case report
├── schema_full.sql                     # Authoritative master platform schema
├── .gitignore                          # Standard development ignore rules
└── README.md                           # Project documentation and quickstart
```

---

## 📊 Evaluation & Scoring Model

The scoring engine evaluates faculty research on a continuous **0.0–100.0** scale:

$$\text{FinalScore}_i = \min\left(100.0, \max\left(0.0, \text{ROUND}\left(S_{\text{base}, i} \times C_{\text{adj}, i}, 1\right)\right)\right)$$

### Core Research Pillars & Dynamic Weights

| Research Pillar | Engineering / Science (CSE, MECH, BIO) | Humanities & Social Sciences (HSS) | Description |
| :--- | :---: | :---: | :--- |
| **Publication Quality ($S_{\text{pub}}$)** | **35%** | **45%** | Q1 (10.0), Q2 (6.0), Q3 (3.0), Q4 (1.5), Unindexed (0.5), Predatory (0.0) |
| **Citation Impact ($S_{\text{cit}}$)** | **25%** | **30%** | Log-damped citations + h-index + i10-index + 12-month momentum |
| **Sponsored Funding ($S_{\text{fund}}$)** | **15%** | **15%** | Log-scaled competitive grant funding in Lakhs INR (PI and Co-PI) |
| **Patents & IP ($S_{\text{pat}}$)** | **15%** | **0%** | Granted (10.0), Published (5.0), Filed (2.5) with inventor share |
| **PhD Guidance ($S_{\text{phd}}$)** | **10%** | **10%** | Awarded (10.0), Submitted (6.0), Pursuing (3.0) doctoral scholars |
| **Total Weight** | **100% (1.00)** | **100% (1.00)** | Auditable dynamic reallocation for non-applicable pillars |

### Context Adjustments ($C_{\text{adj}} \le 1.30$)
* **Career-Stage Startup Factor ($A_{\text{stage}}$)**: Bounded multiplier ($1.00$ to $1.20$) for early-career Assistant Professors ($\le 5$ years service) to compensate for laboratory startup lag.
* **Workload Recognition Multiplier ($M_{\text{load}}$)**: Continuous linear ramp ($1.00$ to $1.15$) recognizing research produced under heavy instructional contact hours and institutional administrative duties (HOD, Dean, Warden).

---

## 🚀 Running the Database & Prototype Locally

### 1. Database Provisioning & Seeding
```powershell
$env:PGPASSWORD = "postgres"

# Load schema into acadagents database
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d acadagents -f "data/schema_full.sql"

# Seed controlled synthetic dataset
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d acadagents -f "data/seed_agent20.sql"

# Run validation suite
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d acadagents -f "data/validate_agent20.sql"
```

### 2. Executing the Scoring Engine Prototype
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d acadagents -f "data/step3b_scoring_prototype.sql"
```

---

## 🎯 Verified Evaluation Test Cases

| Case | Faculty Member | Department | Designation | Key Profile | Final Score | Dept Rank |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: |
| **A** | **Dr. Rajesh Kumar** (`EMP0002`) | CSE | Associate Professor | 10 publications, but 0 in Q1/Q2; 4 unindexed/predatory | **16.3** | **6 / 6** |
| **B** | **Dr. Ananya Sharma** (`EMP0003`) | CSE | Assistant Professor | 4 publications, all in Q1/Q2; 48 Lakhs SERB grant; 3.3 yrs exp | **57.1** | **3 / 6** |
| **C** | **Dr. Vikramaditya Singh** (`EMP0007`) | MECH | Professor | 3 publications; 1 patent; severe 36 hrs/week Dean+HOD workload | **41.2** | **3 / 6** |
| **D** | **Dr. Sneha Patel** (`EMP0014`) | BIO | Assistant Professor | 9 publications (4 Q1, 5 Q2); 55 Lakhs DBT grant; 3.0 yrs exp | **78.0** | **2 / 6** |

---

## 📄 License & Compliance

Designed and developed for academic institutional benchmarking and hackathon demonstration. All synthetic records are generated under strict relational integrity constraints.
